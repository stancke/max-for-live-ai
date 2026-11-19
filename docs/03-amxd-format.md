# Formato `.amxd`

> O formato não é documentado oficialmente pela Cycling '74, mas é estável e
> relativamente simples. A referência canônica é a ferramenta da própria Ableton:
> [`Ableton/maxdevtools`](https://github.com/Ableton/maxdevtools) (`maxdiff/amxd_textconv.py`).

## 1. Visão geral

Um `.amxd` é um container de chunks no estilo IFF/RIFF. Cada chunk é:

```
FOURCC (4 bytes ASCII) | tamanho (uint32 little-endian) | payload
```

O `tamanho` conta **apenas o payload** (não inclui os 8 bytes do cabeçalho).

## 2. Formato "plain" (usado por este projeto e pelos templates oficiais)

Os templates oficiais do Live 12 (`Resources\Misc\Max Devices\*.amxd`) usam
exatamente esta sequência:

| Offset | Campo | Tamanho | Conteúdo |
|---|---|---|---|
| 0 | `ampf` | 4 | assinatura |
| 4 | size | 4 | `4` (LE) |
| 8 | device type | 4 | `aaaa` audio effect, `mmmm` MIDI effect, `iiii` instrument |
| 12 | `meta` | 4 | chunk de metadados |
| 16 | size | 4 | `4` (LE) |
| 20 | meta value | 4 | `0` |
| 24 | `ptch` | 4 | chunk do patch |
| 28 | size | 4 | tamanho do JSON + NUL (LE) |
| 32 | JSON | N | patcher JSON em UTF-8, terminado em `\0` |

Ou seja: **24 bytes de cabeçalho + JSON + NUL**. É o que `src/amxd.js` gera.

### Device types

| Tag | Tipo |
|---|---|
| `aaaa` | Audio Effect |
| `mmmm` | MIDI Effect |
| `iiii` | Instrument |
| `nagg` | MIDI Tool — Generator (Live 12+) |
| `natt` | MIDI Tool — Transformation (Live 12+) |

O JSON também carrega `patcher.project.amxdtype` como uint32 big-endian da tag:

- `aaaa` → `0x61616161` = `1633771873`
- `mmmm` → `0x6d6d6d6d` = `1835887981`
- `iiii` → `0x69696969` = `1768515945`

## 3. Formato "frozen" (com dependências)

Quando o device é congelado/exportado, o `ptch` não contém JSON puro: contém um
arquivo `mx@c` com o JSON e um trailer de dependências.

Cabeçalho do `mx@c`:

| Offset | Tamanho | Conteúdo |
|---|---|---|
| 0 | 4 | `mx@c` |
| 4 | 4 | `16` (BE) |
| 8 | 4 | `0` (BE, flags) |
| 12 | 4 | tamanho do conteúdo (BE, inclui os 16 bytes de preâmbulo) |
| 16 | N | JSON do patcher |
| ... | ... | trailer `dlst` → `dire` (type, fnam, sz32, of32, vers, flag, mdat) |

O leitor deste projeto aceita os dois formatos. O writer gera o formato plain,
que é mais simples de versionar e é aceito pelo Live/Max.

## 4. O JSON do patcher

Estrutura mínima (resumida):

```json
{
  "patcher": {
    "fileversion": 1,
    "appversion": { "major": 8, "minor": 1, "revision": 2, "architecture": "x64", "modernui": 1 },
    "classnamespace": "box",
    "openinpresentation": 1,
    "devicewidth": 120,
    "boxes": [
      { "box": { "id": "obj-1", "maxclass": "newobj", "text": "plugin~", "numinlets": 2, "numoutlets": 2, "outlettype": ["signal", "signal"], "patching_rect": [40, 20, 53, 20] } }
    ],
    "lines": [
      { "patchline": { "source": ["obj-1", 0], "destination": ["obj-2", 0] } }
    ],
    "latency": 0,
    "project": {
      "version": 1,
      "amxdtype": 1633771873,
      "contents": { "patchers": {} }
    },
    "autosave": 0
  }
}
```

Observações:

- `boxes[]` é uma lista de `{ "box": { ... } }`.
- Subpatchers são caixas com uma chave `patcher` dentro do `box`.
- `lines[]` conecta `[id, outlet]` a `[id, inlet]`.
- O bloco `project` é **obrigatório** para devices autocontidos. Sem ele, o Max
  reclama de "project without a name".
- `parameters` é opcional; os templates oficiais não o incluem, e os parâmetros
  continuam funcionando via `saved_attribute_attributes`.

## 5. Como este projeto implementa

`src/amxd.js`:

- `packAmxd(patcher, { deviceType })` — serializa JSON, adiciona NUL e monta os
  chunks `ampf` + `meta` + `ptch`.
- `unpackAmxd(buffer)` — percorre chunks, aceita `mx@c` e devolve
  `{ patcher, deviceType, frozen, chunks }`.
- `readAmxd` / `writeAmxd` — I/O em disco.
- `describeAmxd` — resumo para inspeção (tipo, boxes, parâmetros etc.).

`src/patch.js`:

- `createPatcher` — esqueleto idêntico ao dos templates oficiais.
- `PatchBuilder` — `obj()`, `connect()`, `dial()`, `toggle()`, `menu()`,
  `comment()`, `audioIn()`, `audioOut()`, `midiIn()`, `midiOut()`, `thisDevice()`.

## 6. Inspeção rápida

```bash
node tools/inspect.js "dist/M4L Gain.amxd"
node build.js --inspect "dist/M4L Gain.amxd"
```

Saída típica:

```json
{
  "deviceType": "audio_effect",
  "frozen": false,
  "devicewidth": 120,
  "presentation": 1,
  "boxCount": 9,
  "lineCount": 9,
  "classes": { "newobj": 6, "live.dial": 1, "live.comment": 1, "message": 1 },
  "parameters": [{ "longname": "Gain", "min": -70, "max": 6, "unitstyle": 4 }]
}
```

## 7. Armadilhas conhecidas

- **Tamanho do chunk**: o campo de tamanho é little-endian e conta só o payload.
  Errar isso gera "file exceeded maximum size" ou device que não abre.
- **NUL final**: o JSON deve terminar em `\0` (o parser oficial tolera, mas o
  formato dos templates inclui).
- **JSON inválido**: uma vírgula sobrando quebra o device.
- **Coordenadas fracionárias**: o Live renderiza borrado; use inteiros.
- **Parâmetros duplicados**: o Live ignora ou renomeia; mantenha nomes únicos.
- **Sem `project`**: erro no Max ao carregar.
- **Device type errado**: o Live recusa arrastar para o slot certo.
