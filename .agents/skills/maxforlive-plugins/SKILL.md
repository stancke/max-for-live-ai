---
name: maxforlive-plugins
description: Cria, edita, empacota e depura dispositivos Max for Live (.amxd) para Ableton Live, incluindo efeitos MIDI, instrumentos, efeitos de áudio e ferramentas que usam a Live API. Use quando o pedido envolver patches Max/MSP para o Live, geração de clipes ou distribuição de devices.
---

# Max for Live

Todos os links desta skill são relativos à pasta que contém este arquivo. Use os arquivos de um projeto existente quando houver um fluxo de build próprio. Para começar em uma pasta vazia, copie o [projeto inicial](assets/starter/) para o diretório de trabalho e siga o [guia de build e exemplos](references/build-e-exemplos.md). Edite a cópia.

1. Identifique o tipo de device, a faixa e posição onde ele será carregado, a entrada e saída, os controles e os requisitos de Live/Max. Confirme a versão antes de usar objetos ou métodos que dependam dela. Se for MIDI Tool do editor de clipes, use um template nativo compatível com a versão de destino.
2. Implemente na fonte editável. Em Max, aproveite o template do tipo certo dentro do Live. Em um fluxo por código, use o builder do projeto ou o exemplo mais próximo desta skill. Confira fluxo de sinais, ordem de mensagens, parâmetros automáveis e restauração de presets. Consulte [patches e depuração](references/patches-e-depuracao.md) para os detalhes.
3. Para integração com o Set, consulte [Live API e clipes MIDI](references/live-api.md). Confirme o destino antes de escrever e preserve clipes existentes, salvo quando o usuário solicitar sua alteração.
4. Gere e inspecione o `.amxd`, verifique dependências e execute os testes pertinentes. Quando houver Live disponível, valide num Set de teste a interação e a saída real. Entregue a fonte, o device, os arquivos externos necessários, os passos de uso e o que foi verificado em cada ambiente.

O projeto inicial compila com Node.js 18 ou superior no Windows e no macOS, usando apenas módulos nativos. A instalação do Live e o suporte a Max for Live são necessários para carregar e testar os devices. Consulte o [manual do Ableton](https://www.ableton.com/en/manual/max-for-live/) e a [documentação do Max](https://docs.cycling74.com/) para recursos específicos da versão de destino.
