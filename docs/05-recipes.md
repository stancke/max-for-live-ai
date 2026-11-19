# Receitas e padrões de construção

> Todos os exemplos usam o builder deste projeto (`src/patch.js`). O objetivo é
> partir de esqueletos corretos e evoluir.

## 1. Audio Effect — esqueleto estéreo

```js
const { PatchBuilder } = require('../src/patch');

function build() {
  const p = new PatchBuilder({ deviceType: 'audio_effect', width: 140 });

  const input = p.audioIn();          // plugin~
  const output = p.audioOut();        // plugout~

  // Processamento por canal
  const left = p.obj('*~', { rect: [40, 70, 40, 20] });
  const right = p.obj('*~', { rect: [96, 70, 40, 20] });

  const gain = p.dial({
    name: 'Gain',
    min: -70,
    max: 6,
    initial: 0,
    unitstyle: 4,                     // dB
  });
  const amp = p.obj('dbtoa', { rect: [170, 60, 50, 20] });

  p.connect(input, 0, left, 0);
  p.connect(input, 1, right, 0);
  p.connect(left, 0, output, 0);
  p.connect(right, 0, output, 1);
  p.connect(gain, 0, amp, 0);
  p.connect(amp, 0, left, 1);
  p.connect(amp, 0, right, 1);

  return p.finish();
}
```

Regras:

- `plugin~` / `plugout~` são estéreo: trate L e R separadamente.
- Para processamento que altera os dois canais juntos (mid/side, stereo width),
  separe e combine explicitamente.
- Sempre pense no **estado inicial**: o ganho precisa ser aplicado no load.

## 2. MIDI Effect — esqueleto

```js
const input = p.midiIn();            // midiin
const parse = p.obj('midiparse');
const format = p.obj('midiformat');
const output = p.midiOut();          // midiout

p.connect(input, 0, parse, 0);
// ... processamento ...
p.connect(format, 0, output, 0);
```

### Filtro de notas (dentro da faixa)

```js
const unpack = p.obj('unpack 0 0');
const split = p.obj('split 0 127');
const pitchDelay = p.obj('pipe 0');   // garante a ordem pitch/velocity
const pack = p.obj('pack 0 0');

p.connect(parse, 0, unpack, 0);
p.connect(unpack, 0, split, 0);
p.connect(split, 0, pitchDelay, 0);
p.connect(pitchDelay, 0, pack, 0);
p.connect(unpack, 1, pack, 1);
p.connect(pack, 0, format, 0);

// Preserva mensagens que não são notas
p.connect(parse, 1, format, 1);
p.connect(parse, 2, format, 2);
p.connect(parse, 3, format, 3);
p.connect(parse, 4, format, 4);
p.connect(parse, 5, format, 5);
```

Por que o `pipe 0`: `unpack` emite pitch e depois velocity; o `pack` dispara
quando recebe na entrada esquerda. Sem o atraso de um tick, a nota sairia com a
velocity anterior. O `pipe 0` empurra o pitch para o próximo tick do scheduler.

Cuidado: ao mudar a faixa com notas seguradas, o note-off pode ser filtrado e a
nota fica presa. Uma evolução é enviar "all notes off" ao mudar a faixa.

## 3. Instrument — esqueleto mono

```
midiin -> midiparse
  notas -> unpack 0 0
    pitch    -> mtof -> cycle~ -> *~ -> plugout~ (L e R)
    velocity -> > 0 -> adsr~ -> *~ (entrada direita)
```

```js
const input = p.midiIn();
const parse = p.obj('midiparse');
const unpack = p.obj('unpack 0 0');
const mtof = p.obj('mtof');
const osc = p.obj('cycle~');
const env = p.obj('adsr~ 5 80 0.6 200');
const gate = p.obj('> 0');
const amp = p.obj('*~');
const output = p.audioOut();

p.connect(input, 0, parse, 0);
p.connect(parse, 0, unpack, 0);
p.connect(unpack, 0, mtof, 0);
p.connect(mtof, 0, osc, 0);
p.connect(osc, 0, amp, 0);
p.connect(unpack, 1, gate, 0);
p.connect(gate, 0, env, 0);
p.connect(env, 0, amp, 1);
p.connect(amp, 0, output, 0);
p.connect(amp, 0, output, 1);
```

Para **polifonia**, o caminho é `poly~` com um patch de voz e alocação de notas
(ou o padrão do template oficial `Max Instrument.amxd`). Isso é melhor construído
e testado sob demanda.

## 4. Parâmetros — convenções

| Tipo de controle | Objeto | `parameter_type` | `unitstyle` |
|---|---|---|---|
| Ganho | `live.dial` | 0 Float | 4 dB |
| Frequência | `live.dial` | 0 Float | 3 Hz |
| Tempo (ms) | `live.dial` | 0 Float | 2 Time |
| Porcentagem | `live.dial` | 0 Float | 5 % |
| Nota MIDI | `live.dial` | 1 Int | 8 MIDI |
| On/off | `live.toggle` | 2 Enum | 0 |
| Lista | `live.menu` | 2 Enum | 0 |

Boas práticas:

- Faixa real do parâmetro, não 0–1 "escondido".
- Inclua `parameter_initial` (valor de fábrica). No load, empurre o valor **atual**
  para o DSP com `bang`/`outputvalue`; `init` só num reset explícito.
- Nome longo único; nome curto de 5–7 caracteres.
- Use `parameter_exponent` para curvas perceptuais (frequência, tempo).
- Para muitos controles, agrupe com `live.banks` (8 por banco).

## 5. Inicialização confiável

```js
const thisDevice = p.thisDevice();
const push = p.message('bang');

p.connect(thisDevice, 0, push, 0);
p.connect(push, 0, gain, 0);
p.connect(push, 0, rate, 0);
```

`live.thisdevice` dispara quando o device carrega **e também ao carregar preset
ou salvar**. O `bang` faz cada `live.dial`/`live.menu` emitir o valor **atual**,
aplicando o estado restaurado no DSP sem resetar nada. Para `live.toggle` e
`live.text`, use `outputvalue` (um `bang` alternaria o estado).

## 6. LFO sincronizado ao tempo do Live

Ideia:

1. `qmetro 20` → `plugsync~` (polling).
2. `plugsync~` outlet 5 = tempo (BPM).
3. Converta a divisão musical desejada em Hz:

```
Hz = BPM / 60 / (batidas por ciclo)
```

Exemplos:

| Divisão | Batidas/ciclo | Hz a 120 BPM |
|---|---|---|
| 1/4 | 1 | 2 Hz |
| 1/8 | 0.5 | 4 Hz |
| 1 compasso 4/4 | 4 | 0.5 Hz |
| 1/2 nota | 2 | 1 Hz |

4. `cycle~` com essa frequência gera a LFO.
5. Multiplique pela profundidade e some ao sinal/parâmetro.

Para valores que precisam de fase travada (ex.: LFO que reinicia no downbeat),
use os outlets de barra/batida/ticks do `plugsync~` pararesetar a fase.

## 7. Suavização (evitar cliques)

Para mudanças de ganho/parâmetro em áudio:

```
live.dial -> pack 0 20 -> line~ -> *~
```

`pack 0 20` gera `[valor, 20]`, fazendo o `line~` rampear em 20 ms.

Alternativa: `rampsmooth~ 64 64` (64 samples de subida/descida).

## 8. Controlar o Live (LOM)

Exemplo: seguir o tempo do Set e mostrar em um número.

```
live.path live_set → live.observer property tempo → number
```

Exemplo: disparar o clip da track 1, slot 1, por um botão:

```
live.path live_set tracks 0 clip_slots 0 clip
  → live.object call fire
```

Exemplo em JavaScript (`js`/`v8`):

```js
// O bang vem de live.thisdevice conectado ao js/v8.
function bang() {
  if (!this.track) {
    this.track = new LiveAPI(onTrack, "live_set tracks 0");
    this.track.property = "mute";
  }
}

function onTrack(args) {
  post("track mute:", args, "\n");
}
```

Sempre inicialize depois do `live.thisdevice` e nunca no escopo global.

## 9. Presets e estado

- Parâmetros expostos já são salvos pelo Live no device.
- Para estado interno (passos de sequenciador, padrões, samples), use
  `pattrstorage` + `pattr` ou `coll`/`dict`.
- Salve o estado no `live.thisdevice` bang e restaure no mesmo ponto.

## 10. Checklist de teste

Antes de considerar um device pronto:

- [ ] Arrasta para o slot correto (áudio/MIDI/instrumento).
- [ ] Aparece no device strip com a largura e os controles certos.
- [ ] Não tem controles cortados nem sobrepostos em 170 px.
- [ ] Parâmetros aparecem no Live, com faixa/unidade corretas.
- [ ] Automação grava e reproduz.
- [ ] Valor inicial é aplicado no load e ao recarregar o Set.
- [ ] Áudio não estala ao mudar parâmetros.
- [ ] MIDI de entrada/saída funciona (notas, note-off, CC).
- [ ] Não há notas presas.
- [ ] CPU aceitável com várias instâncias.
- [ ] Salvar/reabrir o Set preserva o estado.
- [ ] Push/bancos (se aplicável) mostram os controles certos.

## 11. Catálogo de ideias

Para orientar pedidos futuros:

**Áudio**: EQ, compressor, saturação, delay, reverb, chorus, flanger, phaser,
bitcrusher, filtro, gate, sidechain, mid/side, stereo width, limiter, granular,
vocoder, pitch shifter, tape stop, DJ filter.

**MIDI**: arpeggiator, chord generator, scale quantizer, note filter, velocity
scaler, humanizer, strum, note repeat, Euclidean sequencer, probability gate,
MIDI monitor, CC mapper, LFO MIDI, envelope follower MIDI.

**Instrumentos**: subtractive, FM, wavetable, additive, drum synth, sampler,
granular, physical modeling, drone, noise.

**Ferramentas Live**: clip launcher, scene morph, track controller, setlist,
LOM inspector, auto-namer, tempo tapper, controller mapping.

Diga o tipo, o comportamento, os controles e as faixas; o resto a gente constrói.
