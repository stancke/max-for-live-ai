# Build e exemplos

O projeto inicial está em [assets/starter](../assets/starter/). Copie a pasta inteira para um diretório gravável. Use o PowerShell no Windows ou o Terminal no macOS. Os comandos abaixo são iguais nos dois sistemas e partem da raiz da cópia.

```sh
node --version
node build.js --list
node build.js
node tools/validate.js
node tools/inspect.js "dist/M4L Gain.amxd"
node tools/test-drums.js
node tools/test-mono-101-lead.js
```

Para recompilar só um device, passe o slug, por exemplo `node build.js m4l-gain`. O build grava em `dist/`, atualiza os arquivos correspondentes e copia as dependências declaradas. A pasta `dist/` também contém os exemplos prontos para abrir.

| Exemplo | Tipo e uso | Fonte |
| --- | --- | --- |
| M4L Gain | Efeito de áudio. Coloque numa faixa com áudio, teste ambos os canais e compare 0 dB com atenuação no dial. | [m4l-gain.js](../assets/starter/devices/m4l-gain.js) |
| M4L Tone Test | Instrumento de diagnóstico. Em uma faixa MIDI, produz um seno contínuo de 220 Hz sem receber notas. Comece com o volume baixo. | [m4l-tone-test.js](../assets/starter/devices/m4l-tone-test.js) |
| M4L Drum Generator | Efeito MIDI que gera clipes. Em uma faixa MIDI com Drum Rack depois do device, clique em **GERAR CLIPE** e reproduza o clipe no primeiro slot vazio da faixa. | [Patch](../assets/starter/devices/m4l-drum-generator.js), [runtime](../assets/starter/src/m4l-drum-generator-runtime.js) |
| M4L Mono 101 | Instrumento monofônico. Em uma faixa MIDI, toque notas ou gere um lead em um slot vazio com **GERAR LEAD** e reproduza o clipe. | [Patch](../assets/starter/devices/m4l-mono-101.js), [runtime](../assets/starter/src/m4l-mono-101-lead.js) |

Use Live 12.2 ou superior com Max 9 para Drum Generator e Mono 101. Mantenha cada `.amxd` ao lado de seu arquivo JavaScript, respectivamente `m4l-drum-generator-runtime.js` e `m4l-mono-101-lead.js`. Ambos os geradores calculam o comprimento em 4/4. Para ouvir a bateria, use pads mapeados para 36 (bumbo), 38 (caixa), 39 (palma), 42/46 (chimbais), 37 (percussão) e 45 (tom).

## Criar um novo device

- Parta de um exemplo em `devices/` e exporte `{ slug, name, type, build }`. Use slug e nome de arquivo únicos. Os tipos aceitos pelo empacotador são `audio_effect`, `midi_effect` e `instrument`.
- [PatchBuilder](../assets/starter/src/patch.js) monta objetos, cabos e parâmetros. A chamada `finish()` retorna o patch para o build. Para objetos fora do catálogo do builder, confirme no Max as entradas, saídas e tipos de sinal e declare-os explicitamente.
- [Empacotador e leitor](../assets/starter/src/amxd.js) geram o container `.amxd` simples. Ao adaptar um device congelado ou MIDI Tool, trabalhe sobre uma cópia no editor do Max e use o formato nativo do host.
- Com `v8` ou outra dependência externa, mantenha nome e capitalização iguais no patch e no arquivo. Liste os arquivos que devem acompanhar o build no array `dependencies`. O empacotador inclui o patch e deixa os arquivos externos ao lado do `.amxd`. Para um único arquivo de distribuição, congele no editor do Max, salve e teste a cópia fora da pasta de desenvolvimento. [Guia de distribuição da Cycling '74](https://docs.cycling74.com/legacy/max8/vignettes/live_sharing)
- Use caminhos relativos ou resolvidos pelo projeto. Para externals nativos, verifique disponibilidade para Windows e macOS e a arquitetura de destino, incluindo Apple Silicon. Use a User Library configurada no Live quando precisar instalar o device.
