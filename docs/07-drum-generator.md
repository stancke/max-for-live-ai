# M4L Drum Generator

Efeito MIDI para Live 12.2 ou superior e Max 9. Cria clipes MIDI em slots vazios da Session View. O dispositivo nao produz audio: use um Drum Rack ou outro instrumento de bateria.

## Instalacao e uso

1. Mantenha `M4L Drum Generator.amxd` e `m4l-drum-generator-runtime.js` juntos na mesma pasta. Copie os dois arquivos se mover o dispositivo.
2. Arraste o `.amxd` para uma faixa MIDI, antes de um Drum Rack com sons carregados.
3. Na Session View, o clipe sera criado no primeiro slot vazio da faixa do proprio dispositivo.
4. Escolha o estilo e o comprimento (1, 2, 4, 8 ou 16 compassos de 4/4), clique em GERAR CLIPE e reproduza o clipe criado.
5. Para outra variacao, gere novamente. O dispositivo usa o primeiro slot vazio e nao substitui clipes existentes.

Estilos: Techno, Melodic Techno, Raw, Psytrance, Psytech, Minimal, House, Breakbeat, Drum n Bass, Progressive House e Tech House. Os resultados sao aleatorios, com variacoes de velocidade e fills a cada quatro compassos.

- **Drum n Bass:** feel de meio tempo, bumbo em dois tempos, caixa no terceiro tempo, chimbal em semicolcheias e caixa fantasma.
- **Progressive House:** quatro no chao, chimbal em semicolcheias, chimbal aberto no contratempo e palma em 2 e 4.
- **Tech House:** quatro no chao com bumbo de reforco, groove de semicolcheias, caixa fantasma e percussao.

Notas MIDI usadas: 36 bumbo, 38 caixa, 39 clap/palma, 42 chimbal fechado, 46 chimbal aberto, 37 percussao e 45 tom. Ajuste os pads do instrumento para essas notas. Os comprimentos assumem 4/4, mesmo em projetos com outra formula de compasso.

A mensagem no dispositivo mostra sucesso ou erro. Em caso de falha, abra o Max Console pelo editor do dispositivo. Caso o Live crie um clipe vazio e ocorra erro ao preencher notas, apague-o manualmente ou gere em outro slot vazio.

## Desenvolvimento

`node build.js m4l-drum-generator` recompila o dispositivo e copia a dependencia JavaScript para `dist`. `node tools/test-drums.js` verifica a geracao; `node tools/validate.js` verifica a estrutura do patch. A execucao no Live precisa de teste manual.

Os geradores procuram de cima para baixo o primeiro slot vazio existente na faixa do dispositivo. Se todos estiverem ocupados (ou nao houver cenas), exibem um aviso; nao criam cenas nem substituem clipes.
