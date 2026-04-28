# Revisão

**Aluno**: Gabriel Walisson Alexandre Matias (gwam@cin.ufpe.br)

## Revisão do sistema

**1. O sistema está funcionando com as funcionalidades solicitadas?**

- Gerenciamento de alunos: OK
- Gerenciamento de metas: OK
- Gerenciamento de turmas: OK
- Persistência: OK
Envio de e-mails: não disponível em produção, mas implementado localmente (com suporte tanto a SMTP real quanto a logs)

Durante os testes, foram observadas algumas intermitências. Em determinados momentos, ao criar uma meta e tentar atualizá-la em seguida, o sistema retornava que ela não existia. Após atualizar a página, a meta não aparecia na listagem; em uma nova atualização, ela voltava a aparecer e podia ser editada normalmente. Esse comportamento também ocorreu com alunos e turmas. Apesar dessas inconsistências, foi possível utilizar o sistema e validar suas funcionalidades em momentos estáveis.

**2. Quais os problemas de qualidade do código e dos testes?**

O backend foi estruturado seguindo princípios de Clean Architecture e DDD, o que indica uma boa organização e qualidade de código. No entanto, essa abordagem parece excessiva para a complexidade do sistema proposto.

Sobre os testes, foram implementados testes de integração para as rotas do backend, alguns testes de unidade no frontend e também foram definidos cenários utilizando Cucumber. Os testes de aceitação ficaram restritos ao backend. Esperava-se uma abordagem mais completa, contemplando o fluxo end-to-end (frontend + backend), possivelmente com o uso de ferramentas como Cypress, Playwright, Selenium ou Puppeteer.

**3. Como a funcionalidade e a qualidade desse sistema pode ser comparada com as do seu sistema?**

De modo geral, o sistema apresenta um nível de robustez elevado, indo além do necessário para um projeto com esse escopo (uso de DDD, banco relacional, dashboard, entre outros). Nesse aspecto, demonstra uma qualidade superior ao sistema que desenvolvi, que adotou uma estrutura mais simples.

Por outro lado, há um ponto de atenção em relação ao deploy: a versão em produção apresentou alguns comportamentos inconsistentes, possivelmente relacionados à camada de persistência ou alguma configuração do ambiente.

## Revisão do histórico do desenvolvimento

**1. Estratégias de interação utilizada**

Foram utilizados poucos prompts no desenvolvimento do segundo experimento (apenas 6 no total, sendo que os dois primeiros já contemplavam grande parte da implementação).

Os prompts incluíram:
- Mapeamento do projeto
- Planejamento (seguindo o padrão Planning)
- Implementação com solicitação de testes e validações (que internamente se torna um Reflection e/ou Guardrails)

Grande parte da condução do desenvolvimento parece ter sido delegada ao agente de código utilizado, embora não tenha ficado claro qual agente foi empregado, nem se houve uso de recursos como arquivos AGENTS.md ou skills.

**2. Situações em que o agente funcionou melhor ou pior**

Dado o baixo número de interações, é razoável concluir que o agente apresentou um bom desempenho desde o início, conseguindo produzir resultados consistentes com pouca necessidade de refinamento.

**3. Tipos de problemas observados (por exemplo, código incorreto ou inconsistências)**

A principal falha identificada foi na implementação da funcionalidade de envio de e-mails. Inicialmente, o agente utilizou apenas um console.log, o que exigiu um novo prompt solicitando a implementação real do envio.

**4. Avaliação geral da utilidade do agente no desenvolvimento**

O agente foi capaz de implementar praticamente todo o sistema com poucos problemas, demonstrando um desempenho satisfatório.

**5. Comparação com a sua experiência de uso do agente**

As abordagens adotadas foram significativamente diferentes. Enquanto neste caso houve uma delegação mais ampla ao agente desde o início, na minha experiência optei por um processo mais incremental, guiando o desenvolvimento por meio da definição de requisitos e implementação de funcionalidades de forma gradual, com revisões constantes.

Apesar das diferenças, ambos os métodos resultaram em sistemas que atendem aos requisitos propostos, variando principalmente no nível de controle exercido pelo desenvolvedor ao longo do processo.