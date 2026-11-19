# Seguir tom e escala do Live

Os geradores Acid 303, Harmonia e Mono 101 possuem o controle TOM LIVE. Ligado, ele consulta a nota e os intervalos atuais do Live no momento de gerar cada clipe. A seleção manual de tom e escala fica preservada e volta a valer quando o botão é desligado. Os menus manuais não são atualizados visualmente enquanto TOM LIVE está ativo. O modo não modifica clipes criados anteriormente.

A escala exibida pelo Live pode acompanhar o clipe selecionado, portanto confirme a nota e a escala na barra superior antes de gerar. TOM LIVE lê as propriedades atuais de Song da Live API, inclusive quando Scale Mode estiver desligado; não altera a escala do projeto nem força outros dispositivos a segui-la. Escalas com pelo menos três intervalos são aceitas; se o Live não fornecer dados válidos, a geração é interrompida sem criar clipe. No Acid, o modo afeta o gerador de clipe MIDI, não os patterns fixos do sequenciador interno.

Após substituir os dispositivos, mantenha seus arquivos runtime JavaScript junto aos .amxd e teste em um set de teste. A leitura da Live API foi simulada, mas exige verificação dentro do Live.

Os geradores procuram de cima para baixo o primeiro slot vazio existente na faixa do dispositivo. Se todos estiverem ocupados (ou nao houver cenas), exibem um aviso; nao criam cenas nem substituem clipes.
