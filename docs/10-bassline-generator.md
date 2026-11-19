# M4L Bassline Generator

Efeito MIDI que cria clipes monofonicos de baixo na Session View. Requer Live 12.2+ com Max 9. Mantenha `M4L Bassline Generator.amxd` e `m4l-bassline-runtime.js` na mesma pasta.

1. Insira o gerador antes de um instrumento de baixo em uma faixa MIDI.
2. Selecione ESTILO, TOM, ESCALA e COMPASSOS (1, 2, 4 ou 8 compassos em 4/4).
3. Opcionalmente ligue TOM LIVE para consultar o tom e os intervalos atuais do Live a cada geracao. Desligado, valem os controles manuais.
4. Clique GERAR BASSLINE e reproduza o clipe criado no primeiro slot vazio da propria faixa, de cima para baixo.

Estilos: Offbeat, Offbeat Groove, Offbeat Octave, Rolling, Rolling Triplet, Rolling Groove e Running. As notas acompanham a escala; algumas variacoes usam aleatoriedade. Nao ha garantia de que cada geracao seja diferente. Sao notas MIDI, e preciso um instrumento para ouvir som.

A busca preserva clipes existentes e nao cria cenas; se nao houver slots vazios, o device informa. Em caso de erro apos a criacao do clipe, um clipe vazio pode permanecer. O TOM LIVE consulta a escala atual de Song, que no Live pode depender do clipe selecionado.

Build: `node build.js m4l-bassline-generator`. Verificacoes: `node tools/test-bassline.js`, `node tools/test-generator-slot.js`, `node tools/test-follow-live-scale.js` e `node tools/validate.js`. Os testes simulados nao substituem a verificacao no Ableton.
