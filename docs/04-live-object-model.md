# Live Object Model (LOM) e Live API

> O LOM é o mapa de tudo que o Max for Live pode acessar dentro do Live:
> aplicação, set, tracks, clips, devices, parâmetros, cenas, transporte.

## 1. Raízes

| Raiz | O que é |
|---|---|
| `live_app` | aplicação (versão, view, etc.) |
| `live_set` | o Set aberto (Song): tracks, scenes, tempo, etc. |
| `live_set view` | estado de visualização (track selecionada, clip em detalhe) |
| `this_device` | o próprio device Max (dentro de um device) |

Exemplos de caminhos:

```
live_set
live_set tracks 0
live_set tracks 0 devices 0
live_set tracks 0 clip_slots 0 clip
live_set scenes 0
live_set view selected_track
live_set view detail_clip
this_device
```

Os caminhos são estáveis em relação à posição (índice). Nomes com espaço são
citados entre aspas:

```
live_set tracks 0 devices "My Device"
```

## 2. Os três objetos do LOM no Max

### `live.path`

Resolve um caminho e produz ids.

- Outlet esquerdo: `id nn` fixo no momento do `goto`/`bang`/`getid`.
- Outlet do meio: `id nn` sempre que o objeto naquele caminho muda (notificação).
- Outlet direito: respostas de `getpath`, `getchildren`, `getcount`.

Mensagens úteis: `goto <path>`, `bang`, `getid`, `getpath`, `getchildren`,
`getcount <child>`, `getinfo`.

### `live.object`

Opera no objeto apontado por um id.

- `get <propriedade>` → valor.
- `set <propriedade> <valor>`.
- `call <função> [args...]`.
- `getinfo` → descrição de filhos, propriedades e funções.
- `goto id <nn>` / recebe `id nn` de um `live.path`.

### `live.observer`

Observa uma propriedade ou filho e emite mudanças.

- `property <nome>` — observa propriedade.
- `property <child>` — observa filho.
- `property <list-child>` — observa lista.
- `getproperty`, `gettype`, `getid`.
- `bang` — pede o valor atual.

## 3. LiveAPI em JavaScript (`js` / `v8`)

Dentro de um objeto `js` ou `v8`, você pode usar a classe `LiveAPI`.

```js
// Não crie LiveAPI no escopo global: espere o device carregar.
// O bang abaixo vem de um objeto live.thisdevice conectado ao js/v8.
function bang() {
  if (!this.tempo) {
    this.tempo = new LiveAPI(onTempo, "live_set");
    this.tempo.property = "tempo"; // passa a observar
  }
  post("tempo atual:", this.tempo.get("tempo"), "\n");
}

function onTempo(args) {
  // args = ["tempo", 120.0] (nome da propriedade + valor)
  post("tempo mudou:", args, "\n");
}
```

### Métodos e propriedades

| Membro | Uso |
|---|---|
| `new LiveAPI(callback, path)` | cria a referência |
| `.get(prop)` | lê uma propriedade |
| `.set(prop, valor)` | escreve uma propriedade |
| `.call(fn, ...args)` | chama uma função do LOM |
| `.getcount(child)` | conta filhos |
| `.children` | array de filhos |
| `.goto(path)` | navega |
| `.property = "nome"` | observa propriedade/filho |
| `.path` / `.unquotedpath` | caminho atual |
| `.id` | id dinâmico (não persista entre sessões) |
| `.type` / `.proptype` | tipos |
| `.info` | descrição completa |
| `.valid` | se a referência é válida |

Atenção:

- O `LiveAPI` não pode ser criado/usado no thread de alta prioridade. Use
  `live.thisdevice` para inicializar e `defer`/`deferlow` para reenfileirar.
- Ids são dinâmicos. Guarde **caminhos**, não ids, entre execuções.
- Chamadas que alteram o Set entram no **undo** do Live. Para modulação contínua,
  prefira `live.remote~`.

## 4. Receitas de LOM

### Volume de uma track

```
live.path live_set tracks 0 mixer_device volume
  → live.object
     get value
     set value 0.75
```

### Mute/solo/arm

```
live.path live_set tracks 0
  → live.object set mute 1
  → live.observer property mute
```

### Disparar um clip

```
live.path live_set tracks 0 clip_slots 0 clip
  → live.object call fire
```

### Tempo do Set

```
live.path live_set
  → live.object get tempo
  → live.observer property tempo
```

### Parâmetro de um device

```
live.path live_set tracks 0 devices 0 parameters 0
  → live.object get value
  → live.object set value 0.5
```

### Track selecionada

```
live.path live_set view selected_track
```

### Clip em detalhe (o que está aberto no editor)

```
live.path live_set view detail_clip
```

## 5. Descobrir o LOM na prática

O jeito mais rápido de explorar:

1. Crie um device com `live.path` + `live.object`.
2. Aponte para `live_set`.
3. Mande `getinfo`.
4. O outlet mostra filhos, propriedades e funções disponíveis.

A referência online do LOM lista todas as classes, propriedades e funções:
<https://docs.cycling74.com/apiref/lom/>.

## 6. Limites e cuidados

- Nem tudo no Live é acessível. O LOM cobre o que a Ableton expõe.
- Algumas operações são proibidas durante notificações (ex.: modificar o Set
  dentro de um callback de mudança). Reagende com `deferlow`.
- `live.remote~` controla parâmetros em tempo real, mas não grava automação nem
  entra no undo. É para modulação.
- `live.object set` em parâmetros pode brigar com a automação; para automação
  "de verdade", o parâmetro deve ser do próprio device (`live.dial` etc.).
- Sempre valide `id 0` (objeto inexistente) antes de operar.
