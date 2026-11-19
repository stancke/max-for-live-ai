# Guia de agentes: plugins Max for Live

Este guia orienta pessoas e agentes a criar, corrigir e entregar dispositivos para Ableton Live neste repositório. As instruções de execução ficam em `AGENTS.md`; a skill reutilizável está em `.agents/skills/maxforlive-plugins/SKILL.md`.

## Como pedir ao agente

Descreva o objetivo musical e, sempre que possível:

- **Tipo:** efeito MIDI, instrumento, efeito de áudio ou ferramenta MIDI.
- **Entrada e saída:** notas externas, clipe MIDI, áudio estéreo ou interação com o Live.
- **Controles:** nomes, faixas, valores iniciais e se precisam de automação.
- **Comportamento:** exemplo concreto, sincronização, comprimento, presets e tratamento de notas.
- **Destino:** faixa, slot da Session View ou local do arquivo; informe se clipes existentes podem ser alterados.
- **Compatibilidade:** versões de Live e Max, quando diferentes das disponíveis no projeto.

Exemplo: “Crie um efeito MIDI para Live 12 que gere um clipe de bateria de 1, 2 ou 4 compassos em um slot vazio da Session. Quero presets Techno e House, botão Gerar e mapeamento compatível com Drum Rack.”

O agente deve decidir opções de implementação razoáveis, esclarecer apenas o que for indispensável e manter o usuário informado. O usuário pode pedir para usar a skill `maxforlive-plugins`; a descoberta automática pode depender da configuração da sessão e de recarregamento das skills. Se ela não estiver listada, abra o `SKILL.md` pelo caminho acima.

## Uso de múltiplos agentes

Se o usuário pedir delegação, ou outra instrução aplicável a autorizar, o agente principal pode dividir um trabalho maior em tarefas independentes. Exemplos:

| Papel | Trabalho |
|---|---|
| Principal | Especificação, integração, decisões e entrega. |
| Implementação | Patch, interface, roteamento e build em arquivos definidos. |
| Pesquisa | Conferir a documentação oficial dos objetos Max e da Live API. |
| Validação | Examinar ordem de eventos, segurança dos dados e testes, sem alterar os mesmos arquivos que outro agente. |

Cada agente deve receber um objetivo claro, arquivos permitidos e critérios de conclusão. O principal revisa os resultados e executa a integração. Não presuma que vários agentes são necessários em mudanças pequenas; respeite os limites e instruções da sessão.

## Arquitetura deste projeto

| Caminho | Função |
|---|---|
| `devices/` | Definições de devices; cada módulo exporta `slug`, `name`, `type` e `build`. |
| `src/patch.js` | `PatchBuilder`: objetos Max, conexões, controles e presentation mode. |
| `src/amxd.js` | Escrita e leitura do container `.amxd`. |
| `build.js` | Compila dispositivos para `dist/` e copia dependências declaradas. |
| `tools/` | Inspeção, validação estrutural e testes específicos. |
| `docs/` | Referências locais de Max, Live API e formato do projeto. |
| `dist/` | Arquivos gerados para uso no Live. |

Para criar um device, consulte o exemplo mais próximo em `devices/`, implemente em fonte e gere o `.amxd` pelo build. Declare dependências externas no módulo do device quando aplicável. O container plain gerado pelo projeto não é automaticamente congelado: ao distribuir, acompanhe os arquivos de runtime necessários e forneça instruções claras.

## Seleção do tipo e do fluxo

| Tipo | Uso | Entrada / saída típicas |
|---|---|---|
| MIDI Effect | Antes de um instrumento, em faixa MIDI | `midiin` → processamento → `midiout`. |
| Instrument | Gera áudio em faixa MIDI | `midiin` → síntese → `plugout~` estéreo. |
| Audio Effect | Processa sinal | `plugin~` estéreo → processamento → `plugout~` estéreo. |
| MIDI Tool | Atua no editor de clipes | Formato e APIs próprios; verifique a versão e o suporte do projeto. |

Um gerador MIDI não produz som por si só: precisa de um instrumento compatível. Ao gerar clipes via Live API, explique o alvo e a necessidade de slot vazio; preserve conteúdo existente. Evite trabalhar diretamente no projeto aberto do usuário quando um teste isolado for possível.

## Max: pontos que exigem atenção

- Leia a documentação dos objetos usados e confirme número e tipo de entradas/saídas. Cabos válidos estruturalmente não garantem comportamento correto.
- `trigger` e `unpack` emitem da direita para a esquerda. Projete a ordem entre atualizar dados, preparar entradas frias e disparar a entrada quente. Controle explicitamente múltiplas conexões que precisem de ordem.
- Em modo button, `live.text` envia `bang` no clique; não filtre esse sinal com `sel 1`. Teste o caminho do botão até a ação.
- Para envelopes `line~`, verifique listas de pares alvo/tempo e o efeito de mensagens sucessivas sobre as rampas pendentes. Teste em áudio real quando possível.
- Considere note-on, note-off, velocity, canais MIDI, sobreposição de notas, saturação, controles iniciais e automação conforme o device.
- Use `live.thisdevice` para inicialização após o carregamento. Preservar valores salvos e presets é diferente de executar `init`, que restaura valores iniciais.
- Operações da Live API devem ocorrer no contexto apropriado de baixa prioridade; valide alvo, tipo, permissão e estado. `LiveAPI` não deve ser criado no escopo global antes de o Live estar pronto. Confira caminhos, assinaturas e disponibilidade por versão na documentação oficial.
- Em Max 9, `v8` pode carregar JavaScript externo. Quando usado, documente a versão mínima e garanta que o arquivo seja encontrado no computador de destino; não descreva um `.amxd` plain com dependências externas como autocontido.

As referências em `docs/` são úteis, mas podem conter hipóteses ou informações desatualizadas. Para detalhes de objetos, Live API e versões, confira as fontes oficiais: [Max](https://docs.cycling74.com/) e [Live Object Model](https://docs.cycling74.com/apiref/lom/).

## Build e validação

Na raiz do projeto:

```powershell
node build.js --list
node build.js <slug>
node tools/validate.js
node tools/inspect.js "dist/<Nome do device>.amxd"
```

Execute também testes específicos que existam para o device, por exemplo `node tools/test-acid.js`, `node tools/test-drums.js` e `node tools/test-drum-trigger.js` quando pertinentes. Crie testes para comportamento relevante, não apenas para repetir detalhes internos da implementação. Se houver scripts externos, confira a presença e a versão do arquivo entregue.

A validação estrutural identifica problemas de container, objetos, parâmetros e cabos. Uma simulação pode exercitar decisões e chamadas esperadas. **Nenhuma das duas, sozinha, comprova que o device carrega, gera notas ou emite áudio no Live.**

Quando houver acesso apropriado ao Live, valide em um set de teste: carregamento, interface, inicialização, geração/roteamento, áudio ou MIDI efetivo, estados de erro e restauração. Para gerador de clipe, verifique slot vazio, slot ocupado, duração e notas. Para áudio, confira sinal em ambos os canais, volume e ausência de clicks evidentes. Não sobrescreva material do usuário para testar.

Se o teste no Live não for possível, diga isso explicitamente e informe como o usuário pode testar; não declare funcionamento confirmado. Em caso de falha, peça a mensagem visível e use o Max Console e os logs disponíveis para investigar. Cite a evidência e distinga causa confirmada de hipótese.

## Entrega

Informe o arquivo `.amxd`, dependências, onde posicionar o device, passos de uso, resultados de testes e limitações. Se precisar que o usuário atualize uma instância já carregada, explique como substituir ou recarregar a instância. Mantenha as instruções práticas e proporcionais ao pedido.

## Regras do projeto

Responda em português do Brasil, com tom leve e uma referência breve a filmes dos anos 80. Nunca apague um banco de dados e nunca execute `artisan migrate:fresh`.
