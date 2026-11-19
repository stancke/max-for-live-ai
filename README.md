# Max for Live com IA

Crie efeitos, instrumentos e ferramentas MIDI para o Ableton Live a partir de uma ideia musical. Este projeto reúne devices prontos para experimentar e uma **skill** que orienta o Codex ou o OpenCode a criar e adaptar seus próprios devices.

## Experimente no Ableton Live

1. No GitHub, clique em **Code → Download ZIP** e extraia a pasta.
2. Abra a pasta [dist](dist/) do projeto.
3. Arraste o arquivo `.amxd` para uma faixa no Live. Se o exemplo tiver um arquivo `.js` ou outro recurso junto dele, mantenha os arquivos na mesma pasta.

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

## Use com Codex ou OpenCode

1. Abra a pasta extraída no **Codex** ou no **OpenCode**.
2. No Codex, mencione `$maxforlive-plugins`. No OpenCode, comece com “Use a skill maxforlive-plugins”.
3. Diga o que o device deve fazer e quais controles você quer. Se souber, informe sua versão do Live e do Max.
4. Abra o arquivo gerado em um Set de teste e ouça o resultado. Se algo sair diferente, descreva o que aconteceu para o assistente ajustar.

Se o OpenCode não listar a skill ao abrir esta pasta, comece a conversa com “Leia `.agents/skills/maxforlive-plugins/SKILL.md` e siga as instruções para criar meu device.” Isso permite que o assistente leia o guia diretamente.

Para usar a skill em outro projeto, copie a pasta inteira `maxforlive-plugins` para `.agents/skills/` na raiz do projeto de destino. Para ter acesso em todos os seus projetos, coloque-a em `.agents/skills/` dentro da sua pasta de usuário. No macOS, pressione **⌘ + Shift + .** no Finder para mostrar pastas que começam com ponto. Se a skill demorar a aparecer, reabra o assistente. [Guia do Codex](https://developers.openai.com/codex/skills) · [Guia do OpenCode](https://opencode.ai/docs/skills/)

## 5 prompts prontos para copiar

Escolha uma ideia, copie o pedido e ajuste os detalhes ao seu som. Se souber, acrescente a versão do seu Ableton Live.

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

## Para criar a partir dos exemplos

O projeto inicial da skill roda no Windows e no macOS com **Node.js 18 ou superior**. Os exemplos prontos podem ser abertos diretamente no Live. O Node.js é usado para gerar novos arquivos a partir do código. O [guia de build](.agents/skills/maxforlive-plugins/references/build-e-exemplos.md) traz os comandos, as fontes e os testes.

Os testes disponíveis conferem a estrutura dos arquivos e simulam parte da geração de clipes. A resposta dos controles, o áudio e o MIDI precisam ser conferidos no Live.

*“Grande Scott!”* — De Volta para o Futuro
