# Patches e depuração

| Tipo | Ponto de partida |
| --- | --- |
| Efeito MIDI | `midiin` → processamento → `midiout`, antes de um instrumento. Confira note-on, note-off, canais e mensagens que precisam passar intactas. Se uma transformação muda enquanto uma nota está ativa, garanta que o note-off alcance o pitch e canal efetivamente emitidos. |
| Instrumento | MIDI → voz e envelope → `plugout~` estéreo. Teste nota, velocity, gate e sobreposição conforme a polifonia planejada. |
| Efeito de áudio | `plugin~` estéreo → processamento → `plugout~` estéreo. Confira os dois canais, clipping e suavização quando o usuário altera parâmetros de ganho. |
| MIDI Tool | Use um template de Generator ou Transformation do editor de clipes na versão de Live de destino. Um efeito MIDI pode criar um clipe via Live API como no Drum Generator. |

## Ordem, apresentação e inicialização

- `trigger` e `unpack` emitem da direita para a esquerda. Atualize inlets frios antes do disparo do inlet quente. Quando a ordem entre ramificações importar, explicite-a com `trigger` ou com a ordem das conexões.
- Um clique em `live.text` no modo button emite `bang`. Ligue-o ao disparo da ação ou a uma mensagem nomeada. Um filtro `sel 1` espera o número 1.
- Em `line~`, verifique a lista de pares alvo/tempo e a unidade de tempo. Mensagens sucessivas podem substituir rampas pendentes. Observe os envelopes no host.
- Em `live.thisdevice`, sincronize o DSP ou runtime com os valores atuais, inclusive após carregar presets. Use `bang` nos controles que o suportam para emitir o valor restaurado. Reserve mensagens de reset para uma ação deliberada.
- Na apresentação do device, use nomes estáveis, unidades, limites e valores iniciais coerentes. Ative automação nos parâmetros necessários e teste a reabertura do Set.

## Verificação

1. Inspecione o `.amxd` que será entregue. Confira tipo, conexões e arquivos externos. O validador local verifica propriedades estruturais, e os testes Node podem exercitar algoritmos e chamadas simuladas.
2. Carregue a cópia num Set de teste. Abra o Max Console pelo editor e confira inicialização, controles, presets, roteamento e áudio ou MIDI real. Para clipes, teste destino vazio, destino ocupado e duração. Recarregue o device a partir da pasta de entrega para verificar a resolução das dependências.
3. Se houver falha, siga o fluxo da entrada até a saída e isole a primeira etapa sem sinal ou sem mensagem. Registre o cenário, a versão do Live/Max e a mensagem do console. Se o Live estiver indisponível, indique quais verificações ficaram restritas à estrutura ou à simulação.

Referências oficiais de [live.thisdevice](https://docs.cycling74.com/reference/live.thisdevice/), [live.text](https://docs.cycling74.com/reference/live.text/) e [line~](https://docs.cycling74.com/reference/line~/).
