# Max for Live — arquitetura e objetos

> Fontes: documentação local do Max 9.1.4 embutido no Live 12.4.3
> (`Resources\Max\resources\docs\refpages`) e os templates oficiais
> `Resources\Misc\Max Devices\Max *.amxd`.

## 1. O que é

Max é um ambiente de programação visual por **dataflow**: objetos (caixas) trocam
mensagens por cabos. Camadas:

- **Max** — controle, mensagens, listas, tempo, lógica.
- **MSP** — processamento de áudio (objetos com `~`).
- **Jitter** — vídeo, matrizes, OpenGL (`jit.*`).
- **Gen** — código compilado para DSP (opcional).

Max for Live é o Max rodando **dentro** do Live, com objetos e APIs específicas
(`live.*`). O device é um `.amxd`.

## 2. Tipos de device e I/O

| Tipo | Slot no Live | Entrada | Saída | Objetos-chave |
|---|---|---|---|---|
| **Audio Effect** | Audio Track / após instrumento | áudio | áudio | `plugin~`, `plugout~` |
| **MIDI Effect** | MIDI Track, antes do instrumento | MIDI | MIDI | `midiin`, `midiout` |
| **Instrument** | MIDI Track | MIDI | áudio | `midiin`, `plugout~` |
| **MIDI Tool** (Live 12+) | editor de clip | notas | notas | formato próprio (`nagg`/`natt`) |

Regras práticas:

- `plugin~` e `plugout~` são **stereo** por padrão: 2 inlets / 2 outlets de sinal
  (L e R). Ligue canal a canal.
- Em M4L use `midiin` / `midiout` para MIDI. `notein` / `noteout` são do Max
  standalone e não substituem o fluxo do Live.
- `midiin` entrega **bytes crus**; `midiparse` separa por tipo; `midiformat`
  remonta; `midiout` envia.
- `live.thisdevice` manda um bang quando o device terminou de carregar (inclusive
  a Live API). Use para inicialização.

### Saídas do `midiparse`

| Outlet | Conteúdo |
|---|---|
| 0 | notas (pitch, velocity) — note-on e note-off |
| 1 | poly key pressure (key, value) |
| 2 | control change (controller, value) |
| 3 | program change |
| 4 | aftertouch / channel pressure |
| 5 | pitch bend |
| 6 | canal MIDI |
| 7 | mensagem `midievent` |

### Entradas do `midiformat`

| Inlet | Conteúdo |
|---|---|
| 0 | nota (pitch, velocity) |
| 1 | poly pressure (pressão, pitch) |
| 2 | control change (controlador, valor) |
| 3 | program change |
| 4 | channel pressure |
| 5 | pitch bend |
| 6 | canal MIDI |

## 3. Objetos específicos do M4L

### UI (aparecem no device strip)

| Objeto | Uso |
|---|---|
| `live.dial` | knob contínuo; parâmetro automável |
| `live.slider` | slider vertical/horizontal |
| `live.numbox` | entrada numérica |
| `live.toggle` | booleano |
| `live.text` | botão/alternador com texto |
| `live.menu` | menu dropdown |
| `live.tab` | abas |
| `live.step` | sequenciador de passos |
| `live.grid` | grade de passos |
| `live.comment` | rótulo de texto |
| `live.gain~` | ganho em dB (stereo) |
| `live.meter~` | medidor de nível |
| `live.scope~` | osciloscópio |

### Sistema / Live API

| Objeto | Uso |
|---|---|
| `live.thisdevice` | bang quando o device carrega |
| `live.path` | resolve um caminho do LOM e devolve id |
| `live.object` | get/set/call em um objeto do Live |
| `live.observer` | observa propriedade/filho do LOM |
| `live.remote~` | controla parâmetro em tempo real, sem undo/automação |
| `live.map` | mapeamento de parâmetro |
| `live.banks` | organiza parâmetros em bancos (Push) |

### Áudio/MIDI

`plugin~`, `plugout~`, `plugsync~`, `midiin`, `midiout`, `midiparse`,
`midiformat`, `poly~`, `adsr~`, `cycle~`, `phasor~`, `svf~`, `biquad~`, `pfft~`.

## 4. Parâmetros (o coração de um device útil)

Um controle só aparece como parâmetro no Live se tiver `parameter_enable: 1`.
No JSON do patch, os metadados ficam em `saved_attribute_attributes.valueof`.

Atributos principais:

| Atributo | Significado |
|---|---|
| `parameter_longname` | nome completo, **único** na hierarquia do patcher |
| `parameter_shortname` | nome curto exibido no device (5–7 caracteres) |
| `parameter_type` | `0` Float, `1` Int, `2` Enum, `3` Blob |
| `parameter_mmin` / `parameter_mmax` | faixa do parâmetro |
| `parameter_enum` | lista de valores para Enum |
| `parameter_initial_enable` | `1` para usar valor inicial |
| `parameter_initial` | array com o valor inicial |
| `parameter_unitstyle` | unidade exibida (ver tabela) |
| `parameter_exponent` | curva do dial (>1 comprime no topo) |
| `parameter_units` | unidade customizada (unitstyle 9) |
| `parameter_order` | ordem em bancos |
| `parameter_linknames` | `1` faz o scripting name seguir o long name |

### Parameter Visibility

Controla como o parâmetro aparece no Live:

| Modo | Automação | Salvo no Set | Visível | Tipos |
|---|---|---|---|---|
| **Automated and Stored** (padrão) | sim | sim | sim | int, float, enum |
| **Stored Only** | não | sim | não | qualquer |
| **Visible** | não | sim | sim | qualquer |
| **Visible (Not Stored)** | não | não | sim | qualquer |
| **Hidden** | não | não | não | qualquer |

Para a maioria dos controles, o padrão **Automated and Stored** é o correto. Use
**Stored Only** para estado que não deve ser automatizado e **Visible (Not
Stored)** para botões momentâneos.

### Unit styles observados no Max 9

| Índice | Unidade |
|---|---|
| 0 | Int |
| 1 | Float |
| 2 | Time (ms) |
| 3 | Hertz |
| 4 | deciBel |
| 5 | Percentage |
| 6 | Pan |
| 7 | Semitones |
| 8 | MIDI |
| 9 | Custom |

> O índice é inferido dos devices oficiais e da ordem documentada em
> `parameters.maxref.xml`. Use-o como referência prática.

### Bancos

`live.banks` agrupa parâmetros em bancos de 8 para o Push e para a navegação.
Sem ele, o Live cria um banco único. Para devices com muitos controles, vale a pena.

### Boas práticas de parâmetro

- Nome longo único; nome curto legível.
- Faixa e unidade coerentes (dB, Hz, ms, semitons, %).
- Valor inicial definido (`parameter_initial_enable: 1`) e aplicado no load.
- Evite faixas gigantes com Int (limite nativo de 256 valores); use Float + unit
  style Int quando precisar de inteiros grandes.
- Um parâmetro = um controle. Não duplique nomes.

## 5. UI e presentation mode

O Live mostra o device em **presentation mode**, não o patch cru.

- `openinpresentation: 1` no patcher.
- `devicewidth` define a largura em pixels.
- A altura útil do device strip é **~170 px** (o template oficial usa
  `openrect [0, 0, 0, 169]`).
- Cada controle visível precisa de:
  - `presentation: 1`
  - `presentation_rect: [x, y, w, h]`
- Use coordenadas **inteiras** (evita borrão em telas não-retina).
- Objetos de infraestrutura (`live.thisdevice`, `live.object`, `live.path`,
  `live.remote~`, `midiparse` etc.) ficam **fora** da presentation.
- `live.comment` é a forma mais simples de rótulo visível.
- O usuário pode redimensionar a largura; o layout não deve depender de posições
  absolutas frágeis. Prefira margens e colunas.

## 6. Tempo, scheduler e áudio

- **Audio thread (DSP)**: alta prioridade, tempo real. Não faça I/O, não mexa em
  UI, não chame a Live API.
- **Scheduler (Max)**: baixa prioridade, mensagens, UI, LOM.
- Para mandar dados do DSP para o scheduler, use `defer` / `deferlow`.
- Para temporização musical, `qmetro` quantiza ao grid do Live; `metro` é livre.
- `plugsync~` reporta o estado do host (transporte, barra, batida, ticks, fórmula,
  tempo, samples). Ele é **polled**: mande bang periodicamente (ex.: `qmetro`).
- `line~` / `rampsmooth~` para suavizar mudanças de ganho e evitar cliques.
- `poly~` para polifonia; `thispoly~` identifica a voz.

## 7. Inicialização e estado

- `live.thisdevice` → bang no load — **e também ao carregar preset ou salvar**.
  Use para **empurrar o valor atual** dos controles para o DSP:
  - `bang` em `live.dial`, `live.numbox`, `live.menu`, `live.tab`, `live.slider`;
  - `outputvalue` em `live.toggle`, `live.text` e `live.button` (um `bang` nesses
    alterna o estado em vez de só emitir).
- **Não** mande `init` no `live.thisdevice`: `init` restaura o valor **inicial**
  e emitiria por cima do preset/carregamento salvo. Use `init` somente num reset
  explícito de fábrica.
- Para restaurar estado interno, use `pattr`/`pattrstorage`/`coll` no mesmo bang.
- Para presets internos, `pattrstorage` + `pattr` é o caminho clássico do Max.
  No M4L, o estado do device também é salvo pelo Live nos parâmetros expostos.

## 8. Depuração

- Console do Max (janela de edição) para `print` e erros.
- `live.object getinfo` mostra filhos, propriedades e funções de um objeto do LOM.
- `live.path` com caminho canônico + `getinfo` é a forma mais rápida de explorar.
- `live.thisdevice` outlet 1/2 trazem informações do device (id, etc.).
- Erros comuns: nome de parâmetro duplicado, objeto de UI fora da presentation,
  conexão de áudio canal errado, uso de `notein` em vez de `midiin`.

## 9. Distribuição

- O device final é um `.amxd` autocontido.
- Você pode salvar direto na **User Library** (aparece no Browser) ou em qualquer
  pasta e arrastar para uma track.
- **Freeze** empacota dependências (abstractions, áudio, imagens). **Unfreeze**
  permite editar de novo (se o device não estiver criptografado).
- Para versionar, mantenha o `.maxpat`/JSON e gere o `.amxd` por build — que é
  exatamente o que este projeto faz.
