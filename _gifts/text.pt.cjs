/**
 * Carrier copy for Brazilian Portuguese.
 *
 * Not a translation of text.en.cjs. The Portuguese page is written the way a
 * Brazilian buyer would look for these objects — "carimbo" is a bureaucratic
 * word in Brazil, an everyday tool for signatures and documents, so the seal
 * page leads with that rather than with the decorative angle the English page
 * takes. Where a direct translation would have been stilted, the sentence is
 * rebuilt.
 *
 * Hindi/participle forms are avoided on purpose: the pages are read by people,
 * not by a translation checker, and Brazilian Portuguese reads shorter than
 * English at the same font size.
 */
module.exports = {
  /* ---------- hub page ---------- */
  'hub.title': 'Seu nome chinês em um objeto de verdade — carimbo, pingente, jogo de chá, leque',
  'hub.desc': 'Você já escolheu seu nome chinês: agora coloque-o em algum lugar. Carimbos, pingentes, louça de chá, leques, papelaria, roupas, pelúcias e bases de exposição, com orientação sobre quais caracteres continuam legíveis em cada um.',
  'hub.ogtitle': 'Suportes para o seu nome chinês',
  'hub.ogdesc': 'Quais caracteres sobrevivem no tamanho de um carimbo e quais precisam de um pergaminho. Um guia para transformar um nome chinês escolhido em um objeto físico.',
  'hub.eyebrow': 'Nome · Suporte',
  'hub.h1a': 'Seu nome, em algo',
  'hub.h1b': 'que você guarda',
  'hub.sub': 'Um nome chinês é um projeto gráfico, não só um rótulo. Estes são os objetos em que as pessoas realmente colocam um — e o que cada objeto exige dos caracteres que você escolheu.',
  'hub.note': 'Todo suporte abaixo passa pelo mesmo teste: {bold}o caractere ainda pode ser lido naquele tamanho?{/bold} É por isso que uma página de carimbo e uma de pergaminho recomendam nomes diferentes dentro da mesma biblioteca.',
  'hub.pick.head': 'Comece pelo que você já tem',
  'hub.pick.body': 'Se você ainda não escolheu um nome, gere um primeiro — todas as páginas aqui partem do princípio de que você já sabe quais caracteres quer gravar no objeto.',
  'hub.pick.cta': 'Gerar seu nome chinês',
  'hub.more.head': 'Sobre escolher um suporte',
  'hub.more.p1': 'O carimbo é o mais antigo e o mais chinês de todos: um selo entalhado que transforma um nome em assinatura. Também é o menos tolerante, porque uma pedra do tamanho de uma unha precisa comportar o nome inteiro.',
  'hub.more.p2': 'O pingente, o leque e o pergaminho recuperam espaço em direções diferentes — profundidade no pescoço, altura na folha, área no papel. É todo o compromisso envolvido, e é por isso que este site organiza os suportes pela quantidade de traços que cada um tolera, e não pelo preço.',
  'hub.more.p3': 'Nada aqui é vendido diretamente. As páginas descrevem o que funciona e o que não funciona; o formulário de contato em cada uma serve para falar sobre uma peça específica.',

  /* ---------- enquiry form ---------- */
  'form.head': 'Pergunte sobre esta peça',
  'form.lead': 'Diga qual suporte, qual nome e o que você tem em mente. O botão abre um e-mail já preenchido no seu próprio programa de e-mail — nada é enviado a partir desta página.',
  'form.name': 'Seu nome',
  'form.email': 'Seu e-mail',
  'form.carrier': 'Do que você gostou',
  'form.chinese': 'Seu nome chinês (se já tiver um)',
  'form.message': 'Mais alguma coisa',
  'form.messageph': 'Tamanho, material, prazo ou uma foto de referência de que você gostou',
  'form.send': 'Abrir e-mail preenchido',
  'form.fallback': 'Prefere escrever direto?',
  'form.note': 'O envio abre seu programa de e-mail com os dados já preenchidos. Você pode editar antes de mandar.',

  /* ---------- carrier pages ---------- */
  seal: {
    title: 'Carimbo com nome chinês — quais caracteres sobrevivem no tamanho do selo',
    desc: 'Um carimbo de nome chinês entalhado em pedra ou madeira: quantos caracteres cabem, quais contagens de traços continuam legíveis em 15 mm e por que a gravação é vertical.',
    name: 'Carimbo de nome',
    h1a: 'Um carimbo transforma seu nome em',
    h1b: 'assinatura',
    sub: 'O suporte mais antigo deste site e o de regras mais rígidas. Uma pedra do tamanho de uma unha precisa comportar o nome inteiro, e um caractere que se lê bem no papel não necessariamente se lê aqui.',
    layout: 'Os caracteres são entalhados de cima para baixo porque o carimbo é estampado, não escrito, e o olho lê a impressão como lê uma coluna de texto. Gravação horizontal em pedra pequena comprime cada caractere nas laterais — é a falha que se vê nos carimbos de lembrança baratos.',
    which: 'Dois caracteres com até 10 traços aguentam 15 mm. Isso cobre boa parte da biblioteca — 明, 安, 宁, 和 — mas deixa de fora os mais elaborados. 曦, com 20 traços, vira um quadrado preto compacto quando a pedra é pequena; se esse é o seu nome, este suporte pede uma pedra maior, não outro nome.',
    qualify: 'O carimbo é também o suporte em que o sobrenome pesa mais: três caracteres gravados em profundidade numa pedra pequena precisam ser distribuídos antes de qualquer corte.',
    blurb: 'Dois caracteres com até 10 traços continuam legíveis em 15 mm. Para nomes mais densos, a resposta é uma pedra maior.',
    aside: 'Estampado, não escrito'
  },
  jewelry: {
    title: 'Pingente com nome chinês — um ou dois caracteres, usados todos os dias',
    desc: 'Um colar ou berloque com seu nome chinês: por que um caractere se lê melhor no tamanho de um pingente, quais contagens de traços combinam com gravação em metal e jade, e como o contato com a pele influencia a escolha.',
    name: 'Pingente',
    h1a: 'Um caractere, usado',
    h1b: 'junto à pele',
    sub: 'Um pingente é lido à distância de um braço por quem está perto de você, o que o torna o suporte mais estreito daqui — e aquele em que um único caractere bem escolhido supera o nome completo.',
    layout: 'Um único caractere é centralizado com bastante espaço ao redor. Não é preferência estética: o pingente é um objeto pequeno visto de ângulo, e um caractere que preenche o disco não deixa margem para o olho completar a forma.',
    which: 'Até 12 traços gravam com nitidez num disco de metal ou numa gota de jade. Acima disso os traços se aglomeram na escala do pingente, e um nome como 澜 ou 曦 é melhor servido por um suporte mais largo. Um caractere também faz o nome carregar sentido sem explicação — 静 lê-se como calma antes de alguém perguntar o que significa.',
    qualify: 'Metal e jade são gravados, não impressos, então o verso do disco importa: um pingente de dois lados pode levar o nome completo atrás enquanto a frente guarda o caractere único.',
    blurb: 'Um caractere bem escolhido se lê melhor que um nome inteiro apertado: o pingente é visto à distância de um braço.',
    aside: 'Contato com a pele'
  },
  tea: {
    title: 'Nome chinês no jogo de chá — xícara, bule e colher de chá',
    desc: 'Seu nome chinês na louça de chá: quantos caracteres cabem na parede de uma xícara, por que o esmalte e a queima definem onde o nome pode ir, e quais traços combinam com peças torneadas à mão.',
    name: 'Jogo de chá',
    h1a: 'Um nome na xícara',
    h1b: 'que você usa',
    sub: 'A louça de chá fica na mão, o que devolve o espaço que o carimbo não tem. A parede de uma xícara ou uma colher de chá leva dois caracteres com folga e três com aperto.',
    layout: 'O nome fica na face vertical da xícara, não ao redor da borda: uma inscrição curva perde o primeiro e o último caractere para a curvatura. Numa colher ou na tampa de um pote de folhas, ele corre plano ao longo do comprimento — a superfície mais fácil de todos os suportes daqui.',
    which: 'Até 16 traços funcionam numa xícara torneada à mão, porque a superfície é grande o bastante para dar espaço aos caracteres densos. É neste suporte que os caracteres mais elaborados da biblioteca — 澜, 霖, 霜 — deixam de ser problema.',
    qualify: 'O esmalte pesa mais que o tamanho. Uma argila sem esmalte recebe um nome entalhado ou pressionado que sobrevive à queima; uma xícara esmaltada precisa do nome aplicado como decalque ou como traço a pincel sob o esmalte, o que muda o resultado final da peça.',
    blurb: 'A parede da xícara acomoda dois caracteres, e a argila torneada à mão aceita traços densos que o carimbo borraria.',
    aside: 'Feito para a mão'
  },
  stationery: {
    title: 'Nome chinês em pergaminho, caderno ou ex-libris',
    desc: 'Seu nome escrito no papel e montado: por que pergaminhos levam os nomes mais longos, como um ex-libris difere de um carimbo e quais caracteres combinam com a montagem a pincel.',
    name: 'Pergaminho e papel',
    h1a: 'O papel não tem',
    h1b: 'limite de tamanho',
    sub: 'É aqui que os caracteres densos cabem. Um pergaminho montado, a capa de um caderno ou um ex-libris dão ao nome a área de que ele precisa, então a escolha deixa de ser sobre legibilidade e passa a ser sobre composição.',
    layout: 'Vertical, de cima para baixo, da direita para a esquerda — a direção que uma coluna chinesa sempre seguiu. Na capa de um caderno o nome pode ficar na horizontal, mas um pergaminho lido na horizontal parece decoração, não escrita.',
    which: 'Os 20 traços funcionam aqui. 曦, 馥 e 澜 ficam no seu melhor no papel, e este é o único suporte em que um nome de três caracteres tem espaço para respirar em vez de ficar empilhado.',
    qualify: 'A restrição é o papel, não o caractere. Um pergaminho é montado sobre seda ou papel e depois enrolado, então um nome pintado em papel fino trinca na dobra; a montagem precisa ser planejada antes da escrita.',
    blurb: 'O papel é o único suporte sem limite de tamanho: um caractere de 20 traços enfim pode ser ele mesmo.',
    aside: 'Pincel e montagem'
  },
  fan: {
    title: 'Nome chinês em leque dobrável — o suporte vertical',
    desc: 'Seu nome pintado ao longo da folha de um leque dobrável ou redondo: como o arco muda o traçado, quantos caracteres cabem e por que o leque é a resposta chinesa para uma inscrição cerimonial.',
    name: 'Leque dobrável',
    h1a: 'Uma coluna de caracteres',
    h1b: 'sobre um arco',
    sub: 'O leque é o suporte que se procura quando se quer altura em vez de largura — a folha dá espaço para uma coluna de caracteres ficar em pé, numa forma que carrega inscrições há séculos.',
    layout: 'A inscrição corre ao longo do arco, acompanhando a folha e não a página. Traçar reto sobre um leque montado é o erro que faz o leque parecer impresso em vez de pintado.',
    which: 'Quatro caracteres com até 18 traços cabem na folha sem se amontoar, o que faz do leque o suporte mais generoso para um nome completo fora o papel. Um único caractere se perde na folha; este é um suporte para dois a quatro.',
    qualify: 'O leque dobrável só é inscrito de um lado, e as varetas passam por trás do papel — a escrita precisa ser planejada em torno das dobras, não aplicada e depois descoberta atravessando-as.',
    blurb: 'O leque dá ao nome altura ao longo do arco, em vez de largura — é isso que uma coluna vertical precisa.',
    aside: 'Altura, não largura'
  },
  daily: {
    title: 'Nome chinês em caneca, garrafa ou capa de celular',
    desc: 'Objetos do dia a dia com seu nome chinês: por que a superfície impressa se comporta diferente da gravada, quais contagens de traços continuam nítidas e o que o uso faz com traços finos.',
    name: 'Caneca e garrafa',
    h1a: 'Os objetos que você',
    h1b: 'usa todo dia',
    sub: 'Caneca, garrafa, capa de celular: os suportes de maior uso e menor cerimônia. Impressão e gravação funcionam aqui, e falham de formas diferentes.',
    layout: 'Horizontal, da esquerda para a direita, porque esses objetos são manuseados na orientação ocidental mesmo quando o nome é chinês. Uma coluna vertical dá a volta na curva de uma garrafa e desaparece.',
    which: 'Até 14 traços continuam nítidos na impressão. A gravação numa garrafa ou capa corta uma profundidade fixa independentemente da largura do traço, então traços muito finos podem fechar ou lascar nas bordas com os anos de uso.',
    qualify: 'Lava-louças e atrito de bolso são o teste real. Um nome impresso numa caneca que vai à máquina toda semana desbota mais rápido que o mesmo nome gravado, e os traços horizontais finos são os primeiros a sumir.',
    blurb: 'Impressão e gravação envelhecem de formas diferentes no uso diário, e os traços horizontais finos vão primeiro.',
    aside: 'Impressão ou gravação'
  },
  wear: {
    title: 'Nome chinês em roupa — camiseta, boné, ecobag, lenço',
    desc: 'Seu nome chinês estampado ou bordado em tecido: por que o bordado deforma traços diagonais, quantos caracteres cabem numa estampa de peito e o que o tecido faz com o detalhe.',
    name: 'Roupas',
    h1a: 'No corpo,',
    h1b: 'todo dia',
    sub: 'O tecido aceita os nomes maiores de todos os suportes daqui — três caracteres ficam confortáveis no peito — e também transforma o próprio caractere, porque linha e tinta não desenham um traço da mesma maneira.',
    layout: 'Horizontal no peito ou no painel, porque a roupa é lida de frente para quem a veste. Uma coluna vertical numa ecobag funciona; uma coluna vertical no peito parece listra, não escrita.',
    which: 'Três caracteres com até 18 traços funcionam na estampa. O bordado é mais rígido: a agulha se move em direções fixas, então diagonais longas e horizontais finas se deformam, e um caractere construído com elas — 必, 之 — pode sair irreconhecível em escala pequena.',
    qualify: 'O peso do tecido decide o detalhe. Uma camiseta de algodão pesado segura uma estampa limpa; um lenço leve ou um gorro de tricô perdem traços finos na trama, e o nome precisa ser simplificado em vez de reduzido.',
    blurb: 'O tecido aceita três caracteres no peito, mas a linha se move em direções fixas e entorta as diagonais.',
    aside: 'Linha e tinta'
  },
  plush: {
    title: 'Nome chinês em pelúcia ou almofada',
    desc: 'Uma pelúcia ou almofada bordada com seu nome chinês: por que um único caractere combina com superfície macia, como a direção do bordado afeta os traços e o que o enchimento faz com a linha.',
    name: 'Pelúcia',
    h1a: 'Macio, e ainda',
    h1b: 'legível',
    sub: 'A pelúcia é o suporte com mais personalidade e menos disciplina de superfície. Um caractere bordado grande sobrevive ao macio melhor que um nome completo costurado pequeno.',
    layout: 'Um único caractere, centralizado num painel plano — a almofada da pata, a barriga, a face de uma almofada. Superfícies curvas puxam a linha quando o brinquedo é enchido, então o painel precisa ser bordado antes de ser costurado, não depois.',
    which: 'Até 14 traços bordam com nitidez. As diagonais amolecem num corpo enchido porque o recheio empurra o tecido para fora, então caracteres mais quadrados mantêm a forma melhor que os esparramados.',
    qualify: 'É neste suporte que segurança e materiais mais importam: uma pelúcia destinada a criança está sujeita a regras de segurança de brinquedos na maioria dos mercados, e a linha do bordado entra nessa avaliação, não como detalhe.',
    blurb: 'Um caractere grande bordado num painel plano resiste melhor à maciez do que um nome inteiro costurado pequeno.',
    aside: 'Superfícies macias'
  },
  figure: {
    title: 'Nome chinês na base de exposição — action figure, modelo, suporte',
    desc: 'Um nome gravado na base de uma figure, modelo ou suporte: por que a base é lida de cima, quais traços ficam nítidos na gravação e como um nome personaliza uma peça de exposição.',
    name: 'Base de exposição',
    h1a: 'A base é',
    h1b: 'a assinatura',
    sub: 'Uma base de exposição é lida de cima e de relance, o que a torna o suporte mais próximo em espírito de um carimbo: uma superfície pequena e marcada que diz de quem é a peça.',
    layout: 'Horizontal na borda frontal da placa, onde o olho cai quando a peça é vista de frente. Num suporte que se vê por todos os lados, o nome pertence à face para a qual a peça costuma ser exibida.',
    which: 'Dois caracteres com até 12 traços gravam com nitidez numa placa de metal ou acrílico. Caracteres mais densos funcionam se a placa for grande, mas a base costuma ser dimensionada pela figure, não pela inscrição.',
    qualify: 'Uma base genérica personaliza qualquer figure; uma base moldada para um personagem ou logotipo específico levanta uma questão separada sobre os direitos desse desenho. Se a peça é licenciada, a inscrição é a única parte livremente personalizável.',
    blurb: 'A base é lida de cima e de relance, então a inscrição fica curta e a placa, pequena.',
    aside: 'Lida de cima'
  },
  blade: {
    title: 'Espada decorativa e boken de bambu — sem fio, apenas decoração',
    desc: 'Uma katana de exposição ou shinai de bambu com seu nome chinês, sem fio e decorativa: o que pode ser inscrito, onde, e o que esperar do envio internacional.',
    name: 'Lâmina decorativa',
    h1a: 'Peças de exposição,',
    h1b: 'sem fio',
    sub: 'São peças de parede e de suporte — sem fio, decorativas e não feitas para uso. O nome vai na bainha ou na face plana da lâmina, nunca num fio, porque não há fio.',
    layout: 'Vertical ao longo da bainha ou da face da lâmina, seguindo a linha do objeto. É o suporte em que a coluna vertical não é escolha estética, mas a única orientação que cabe numa superfície longa e estreita.',
    which: 'Um caractere com até 16 traços fica bem ao longo da face da lâmina. Um nome completo de três caracteres é longo demais para a largura e precisa correr pela bainha, onde a superfície é mais larga.',
    qualify: 'Dois pontos práticos antes de tudo. Réplicas de lâmina são restritas ou exigem declaração em muitos países de destino, então o envio internacional pode falhar depois do pedido feito. E a inscrição é uma marca decorativa num objeto de exposição — nada aqui é afiado e nada é vendido como arma.',
    blurb: 'Só peças de exposição, sem fio: o nome vai na bainha ou na face plana da lâmina, nunca na borda.',
    aside: 'Sem fio, decorativo'
  },

  /* ---------- shared labels ---------- */
  'label.which': 'Quais caracteres funcionam aqui',
  'label.layout': 'Por que a disposição é assim',
  'label.qualify': 'Antes de decidir',
  'label.samples': 'Caracteres que combinam com este suporte',
  'label.more': 'Outros suportes',
  'label.all': 'Todos os suportes',
  'label.view': 'Ler o guia',
  'label.crumb': 'Suportes',
  'label.placeholder': 'Ilustração, não a peça final',
  'nav.gifts': 'Suportes',

  'fit.short': 'Continua legível neste tamanho',
  'fit.deep': 'Precisa de uma superfície maior',
  'fit.charslabel': 'Caracteres',
  'fit.strokeslabel': 'Limite de traços',
  'fit.layoutlabel': 'Disposição',
  'fit.layout.vertical': 'vertical',
  'fit.layout.horizontal': 'horizontal',
  'fit.layout.single': 'único',
  'fit.rule': 'Estes caracteres têm {strokes} traços ou menos, então se sustentam neste tamanho.',
  'fit.deepnote': 'E estes passam de {strokes}: neste suporte eles se fecham em vez de se ler.',

  /* ---------- customiser (the workshop panel) ---------- */
  'cw.eyebrow': 'Ateliê',
  'cw.head': 'Grave você mesmo',
  'cw.lead': 'Nem todo pedido começa num nome gerado. Escreva os seus caracteres, deixe a face vazia ou envie uma imagem para ser gravada como um carimbo. A prévia é desenhada na posição real de gravação, no tamanho em que será cortada.',
  'cw.mode.name': 'Seus caracteres',
  'cw.mode.none': 'Deixar vazio',
  'cw.mode.motif': 'Sua imagem',
  'cw.name.label': 'O que gravar',
  'cw.name.ph': 'Até {n} caracteres',
  'cw.name.hint': 'Até {n} caracteres neste suporte, dispostos na {layout} como a amostra da ilustração. Nomes longos são reduzidos em vez de passar da peça.',
  'cw.count': '{n} / {max}',
  'cw.none.hint': 'A peça segue sem nada gravado. Há quem queira só a pedra, o rolo em branco ou a tigela lisa para gravar em casa; é um pedido real e custa o mesmo.',
  'cw.motif.hint': 'A imagem não é impressa na superfície. É reduzida a uma cor e gravada nessa forma, como um carimbo. Traços, monogramas e silhuetas fortes sobrevivem; fotografias perdem detalhe, e a prévia mostra exatamente o que sobrevive.',
  'cw.motif.pick': 'Escolher uma imagem',
  'cw.motif.drop': 'ou solte aqui',
  'cw.motif.thumb': 'A marca que será gravada',
  'cw.motif.err.type': 'Este arquivo não é uma imagem que o navegador leia. Use PNG, JPG, GIF ou SVG.',
  'cw.motif.err.size': 'A imagem é grande demais. Use até 8 MB.',
  'cw.motif.err.empty': 'Nada escuro o bastante para carimbar. Tente uma imagem com mais contraste.',
  'cw.proof': 'Prova',
  'cw.download': 'Baixar a prova',
  'cw.confirm': 'Enviar para o formulário',
  'cw.tip': 'Um desenho, não uma foto da peça pronta. Cor e veio variam com o material.'
};
