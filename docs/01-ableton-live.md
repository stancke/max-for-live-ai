# Ableton Live — o que importa para Max for Live

> Resumo prático dos conceitos do Live que afetam o desenvolvimento de devices.
> Confira a versão ativa do Max nas configurações do Live. Ela pode ser a que vem com o Live ou uma instalação separada.

## 1. As duas visões

| Visão | Para que serve |
|---|---|
| **Session View** | Grade de cenas e clips; performance, loops, lauch. |
| **Arrangement View** | Linha do tempo linear; composição e automação. |

Para um device, isso quase não muda: ele processa o que chega na track. O que muda
é **quando** chega (clips disparados vs. timeline) e como a automação é escrita.

## 2. Tracks e fluxo de sinal

Tipos de track:

- **Audio Track** — recebe áudio (entrada, clip ou outro device).
- **MIDI Track** — recebe MIDI e hospeda instrumentos.
- **Return Track** — barramento de efeitos (sends).
- **Group Track** — agrupa tracks.
- **Master** — soma final.

Fluxo em uma MIDI Track:

```
MIDI in / clip
   ↓
[MIDI Effects]        ← Max MIDI Effect entra aqui
   ↓
[Instrument]          ← Max Instrument entra aqui
   ↓
[Audio Effects]       ← Max Audio Effect entra aqui
   ↓
Fader / Pan / Sends
   ↓
Master
```

Em uma Audio Track, o slot de instrumento não existe; o áudio da entrada/clip vai
direto para os Audio Effects.

Consequências práticas:

- Um **Max Audio Effect** só pode ser arrastado para Audio Track (ou para o slot de
  áudio de uma MIDI Track, depois do instrumento).
- Um **Max Instrument** só pode ir para MIDI Track.
- Um **Max MIDI Effect** só pode ir para MIDI Track, antes do instrumento.
- A ordem importa: MIDI effects transformam eventos antes do instrumento; audio
  effects processam o som depois dele.

## 3. Devices, racks e macros

- **Device**: unidade de processamento (EQ, compressor, synth, device Max).
- **Rack**: container de devices com **chains**, **macros** e **zonas de teclado/velocidade**.
- **Macro**: controle que pode mapear vários parâmetros internos. Um device Max
  também pode ter seus parâmetros expostos e mapeados por macro.
- **Dry/Wet**: em racks e em alguns devices; no seu device Max você decide se
  implementa ou não.

## 4. Automação, modulação e mapeamento

- **Automação**: valores gravados na timeline/Session, ligados ao parâmetro.
- **Modulação**: fonte (LFO, envelope, Max) alterando o parâmetro sem gravar automação.
- **Mapeamento**: controle externo (Push, MIDI CC) ligado a um parâmetro.

No Max for Live, isso se traduz em:

- Parâmetros com `parameter_enable` aparecem no Live, são automatizáveis e
  mapeáveis.
- `live.remote~` controla parâmetros em tempo real de forma "invisível" à automação
  (não gera undo nem grava automação). É a opção para modulação de áudio-rate.
- Alterar um `live.object` diretamente muda o valor e entra no undo; use com
  parcimônia em automação.

## 5. Tempo, transporte e sincronismo

- O Live é o **host**: dita tempo, compasso, transporte e quantização.
- Em M4L, `plugsync~` reporta transporte, compasso, batida, ticks, fórmula de
  compasso, tempo e contagem de samples. Ele é **polled** (recebe bang).
- `metro`/`qmetro` no Max usam o scheduler do Max. `qmetro` quantiza ao grid do Live.
- Para LFOs sincronizados, o caminho comum é `plugsync~` (tempo/posição) ou
  `live.object` observando `live_set tempo`, e converter fase/Hz você mesmo.
- Para delays sincronizados, converta nota → ms com o tempo atual.

## 6. Live 12 — recursos que impactam devices

- **MIDI Tools** (Generators e Transformations) rodam no editor de clip e têm um
  formato de device próprio (tags `nagg` / `natt` no container `.amxd`). São
  diferentes de MIDI Effects "clássicos".
- **MPE**: instrumentos e efeitos podem receber/expressar MPE. No Max, isso chega
  como MIDI por nota/canal e exige parsing mais cuidadoso.
- **Scales**: o Live expõe escala e tonalidade via LOM; devices podem consultar.
- **Push**: parâmetros exposotos aparecem automaticamente; `live.banks` organiza
  bancos de 8 controles.

## 7. Onde o Max for Live entra

O Max for Live é o runtime do Max dentro do Live. Ele permite:

1. Criar **instruments, audio effects e MIDI effects** próprios.
2. Controlar o **próprio Live** via Live Object Model (tracks, clips, devices,
   parâmetros, cenas, transporte).
3. Criar **MIDI Tools** (Live 12+) e ferramentas de composição.
4. Integrar hardware, OSC, rede, arquivos, vídeo (Jitter) etc.

O arquivo final é um **`.amxd`** — um container binário com o patch Max dentro.
Ver [03-amxd-format.md](03-amxd-format.md).

## 8. Checklist mental antes de pedir um device

- **Tipo**: audio effect, MIDI effect, instrument ou MIDI Tool?
- **Entrada/saída**: mono, stereo, MIDI, ambos?
- **Parâmetros**: nomes, faixas, unidades, valores iniciais, enum?
- **Comportamento**: o que faz com o sinal? o que faz com o tempo? o que faz com
  o estado (preset)?
- **Sincronismo**: livre, Hz, ou travado no tempo do Live?
- **UI**: quantos controles cabem em 170 px de altura? precisa de bancos?
- **Caso especial**: polyphony, MPE, gravação, acesso ao LOM?
