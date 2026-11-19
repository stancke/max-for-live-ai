# Max for Live com IA

Crie efeitos, instrumentos e ferramentas MIDI para o Ableton Live a partir de uma ideia musical. Este projeto reúne devices prontos para experimentar e uma **skill** que orienta o Codex ou o OpenCode a criar e adaptar seus próprios devices.

## Comece pelo link

Para criar seu plugin, basta colar este link em uma conversa no **Codex**, no **OpenCode** ou em outro agente com acesso ao GitHub.

```text
https://github.com/stancke/max-for-live-ai
```

Na mesma mensagem, diga o que você quer criar e peça ao agente para seguir a skill do projeto. Ele pode abrir o repositório pelo link, ler a skill e consultar os exemplos. Depois, abra no Ableton Live o arquivo `.amxd` que o agente entregar.

> Leia a skill deste repositório e crie um delay que alterne os ecos entre esquerda e direita. Entregue o arquivo .amxd e me diga como testar no Live.

## Experimente os devices prontos

A pasta [dist](dist/) reúne os exemplos para quem quiser experimentá-los no Live. Escolha um device, baixe o respectivo arquivo `.amxd` e arraste-o para a faixa indicada. Se ele vier com um arquivo `.js` ou outro recurso, mantenha esses arquivos juntos.

| Quero experimentar… | Device | Onde colocar |
| --- | --- | --- |
| Ajustar o volume de uma faixa | [M4L Gain](dist/M4L%20Gain.amxd) | Faixa de áudio |
| Gerar um groove de bateria | [M4L Drum Generator](docs/07-drum-generator.md) | Faixa MIDI, antes de um Drum Rack |
| Tocar um synth mono ou gerar uma melodia | [M4L Mono 101](docs/08-mono-101.md) | Faixa MIDI |
| Testar se sai som pelos dois canais | [M4L Tone Test](dist/M4L%20Tone%20Test.amxd) | Faixa MIDI. O tom é contínuo, então comece com o volume baixo. |
| Explorar timbres e sequências acid | [M4L Acid 303](docs/06-acid-303.md) | Faixa MIDI |

Para carregar os exemplos, você precisa do Live com suporte a Max for Live. O Drum Generator e o Mono 101 foram preparados para Live 12.2 ou superior com Max 9. [Manual do Ableton](https://www.ableton.com/en/manual/max-for-live/)

## O que a skill faz?

A [skill maxforlive-plugins](.agents/skills/maxforlive-plugins/SKILL.md) é um guia que o assistente lê enquanto trabalha. Ela vem com quatro exemplos e ensina a IA a montar o device, gerar o arquivo que o Live abre e explicar onde colocá-lo e como testá-lo. Você descreve o que quer ouvir ou fazer com o MIDI.

## 5 prompts prontos para copiar

Cole o [link do projeto](https://github.com/stancke/max-for-live-ai) junto com um dos pedidos abaixo. Ajuste os detalhes ao seu som e, se souber, acrescente a versão do seu Ableton Live.

### 1. Tremolo no tempo da música

> Use a skill maxforlive-plugins para criar um efeito de áudio estéreo que faça o volume pulsar no tempo da música. Quero escolher entre colcheias e semicolcheias e controlar a intensidade da pulsação. Entregue o arquivo .amxd e diga como testar com um loop de áudio.

### 2. Delay que vai de um lado ao outro

> Use a skill maxforlive-plugins para criar um delay com ecos que alternem entre esquerda e direita. Quero escolher o ritmo dos ecos, a quantidade de repetições e quanto do efeito se mistura ao som original. Entregue o arquivo .amxd e diga como testar com uma batida curta.

### 3. Sintetizador para linhas de baixo

> Use a skill maxforlive-plugins para criar um sintetizador de baixo que eu possa tocar com meu teclado MIDI ou com um clipe. Quero um som encorpado, uma nota por vez e controles para deixar o timbre mais fechado ou mais brilhante. Entregue o arquivo .amxd e diga como montar a faixa no Live.

### 4. Gerador de grooves para Drum Rack

> Use a skill maxforlive-plugins para criar um gerador de bateria com grooves de house e breakbeat. Quero escolher entre 1, 2 e 4 compassos e clicar em Gerar para criar um clipe no primeiro espaço vazio da faixa, preservando os clipes que já existem. Entregue o arquivo .amxd e explique como usar com um Drum Rack.

### 5. Arpejador para transformar acordes em melodias

> Use a skill maxforlive-plugins para criar um efeito MIDI que toque uma nota de cada vez quando eu segurar um acorde. Quero escolher se as notas sobem, descem ou alternam, e ajustar a velocidade no tempo da música. Ao soltar o acorde, o arpejo deve parar. Entregue o arquivo .amxd e diga onde colocá-lo na faixa.

## Instalação opcional da skill

Se você pretende usar a skill com frequência, pode instalá-la no Codex ou no OpenCode. Copie a pasta inteira [maxforlive-plugins](.agents/skills/maxforlive-plugins/) para `.agents/skills/` na raiz do seu projeto. Para ter acesso em todos os projetos, coloque-a em `.agents/skills/` dentro da sua pasta de usuário. No macOS, pressione **⌘ + Shift + .** no Finder para mostrar pastas que começam com ponto. Se a skill demorar a aparecer, reabra o assistente. [Guia do Codex](https://developers.openai.com/codex/skills) · [Guia do OpenCode](https://opencode.ai/docs/skills/)

No Codex, mencione `$maxforlive-plugins`. No OpenCode, peça para usar a skill `maxforlive-plugins`. Se ela não aparecer na lista, peça ao agente para ler o arquivo `SKILL.md` dentro da pasta que você copiou.

## Para criar a partir dos exemplos

O projeto inicial da skill roda no Windows e no macOS com **Node.js 18 ou superior**. Os exemplos prontos podem ser abertos diretamente no Live. O Node.js é usado para gerar novos arquivos a partir do código. O [guia de build](.agents/skills/maxforlive-plugins/references/build-e-exemplos.md) traz os comandos, as fontes e os testes.

Os testes disponíveis conferem a estrutura dos arquivos e simulam parte da geração de clipes. A resposta dos controles, o áudio e o MIDI precisam ser conferidos no Live.

*“Todos esses momentos se perderão no tempo, como lágrimas na chuva.”* — Roy Batty, *Blade Runner* (1982)
