// ============================================================
// BANCO DE PERGUNTAS DO SHOW DO MILHÃO
// Perguntas pré-configuradas por tema e dificuldade
// Cada pergunta: { p: pergunta, v: verdadeira, f: [falsa1, falsa2, falsa3], img: prompt_imagem }
// ============================================================

const BANCO_PERGUNTAS = {

  // ============================
  // 🧠 CONHECIMENTOS GERAIS
  // ============================
  geral: {
    facil: [
      { p: "Qual é o maior oceano do planeta?", v: "Oceano Pacífico", f: ["Oceano Atlântico", "Oceano Índico", "Oceano Ártico"], img: "vast pacific ocean aerial view with blue water" },
      { p: "Quantos dias tem um ano bissexto?", v: "366 dias", f: ["365 dias", "364 dias", "367 dias"], img: "a calendar showing February 29th leap year" },
      { p: "Qual é a cor resultante da mistura de azul e amarelo?", v: "Verde", f: ["Laranja", "Roxo", "Marrom"], img: "blue and yellow paint mixing together" },
      { p: "Qual planeta é conhecido como Planeta Vermelho?", v: "Marte", f: ["Júpiter", "Vênus", "Saturno"], img: "planet Mars red surface from space" },
      { p: "Quantas letras tem o alfabeto português?", v: "26 letras", f: ["24 letras", "28 letras", "23 letras"], img: "alphabet letters scattered on a table" },
      { p: "Qual é o metal líquido à temperatura ambiente?", v: "Mercúrio", f: ["Prata", "Chumbo", "Estanho"], img: "mercury liquid metal droplets on a surface" },
      { p: "Em qual continente fica o Brasil?", v: "América do Sul", f: ["América do Norte", "Europa", "África"], img: "South America continent map highlighted" },
      { p: "Qual é o animal símbolo da Austrália?", v: "Canguru", f: ["Coala", "Ornitorrinco", "Emu"], img: "a kangaroo in the Australian outback" },
      { p: "Quantos lados tem um hexágono?", v: "6 lados", f: ["5 lados", "7 lados", "8 lados"], img: "a perfect hexagon geometric shape" },
      { p: "Qual é a moeda oficial do Japão?", v: "Iene", f: ["Yuan", "Won", "Dólar"], img: "Japanese yen coins and banknotes" },
      { p: "Qual instrumento tem 88 teclas?", v: "Piano", f: ["Órgão", "Acordeão", "Teclado"], img: "piano keys close-up black and white" },
      { p: "Qual é o esporte mais popular do mundo?", v: "Futebol", f: ["Basquete", "Críquete", "Tênis"], img: "soccer ball on green field in a stadium" },
      { p: "O que as abelhas produzem?", v: "Mel", f: ["Cera apenas", "Leite", "Seda"], img: "bees making honey in a honeycomb" },
      { p: "Qual é o maior animal terrestre?", v: "Elefante africano", f: ["Girafa", "Rinoceronte", "Hipopótamo"], img: "african elephant in the wild savanna" },
      { p: "Quantos minutos tem uma hora?", v: "60 minutos", f: ["100 minutos", "45 minutos", "90 minutos"], img: "a clock showing time passing" }
    ],
    medio: [
      { p: "Qual país tem a maior população do mundo?", v: "Índia", f: ["China", "EUA", "Indonésia"], img: "crowded Indian city street with people" },
      { p: "Qual é o rio mais longo do mundo?", v: "Rio Nilo", f: ["Rio Amazonas", "Rio Mississipi", "Rio Yangtzé"], img: "Nile River flowing through Egypt aerial view" },
      { p: "Em que ano o homem pisou na Lua?", v: "1969", f: ["1965", "1972", "1961"], img: "astronaut footprint on the moon surface" },
      { p: "Qual é o menor país do mundo?", v: "Vaticano", f: ["Mônaco", "San Marino", "Liechtenstein"], img: "Vatican City St Peters Basilica aerial view" },
      { p: "Quantos ossos tem o corpo humano adulto?", v: "206 ossos", f: ["208 ossos", "200 ossos", "212 ossos"], img: "human skeleton anatomical model" },
      { p: "Qual vitamina é produzida pela exposição ao sol?", v: "Vitamina D", f: ["Vitamina C", "Vitamina A", "Vitamina B12"], img: "sunlight rays through clouds golden hour" },
      { p: "Quem pintou a Mona Lisa?", v: "Leonardo da Vinci", f: ["Michelangelo", "Rafael", "Botticelli"], img: "Mona Lisa painting in the Louvre museum" },
      { p: "Qual é a capital da Austrália?", v: "Canberra", f: ["Sydney", "Melbourne", "Brisbane"], img: "Canberra Australia Parliament House" },
      { p: "Qual o nome do maior deserto do mundo?", v: "Deserto do Saara", f: ["Deserto de Gobi", "Deserto da Arábia", "Deserto de Atacama"], img: "Sahara desert sand dunes at sunset" },
      { p: "Qual é a fórmula química da água?", v: "H2O", f: ["CO2", "NaCl", "O2"], img: "clear water droplet splashing" },
      { p: "Quem escreveu Dom Quixote?", v: "Miguel de Cervantes", f: ["Shakespeare", "Machado de Assis", "Victor Hugo"], img: "Don Quixote windmill scene illustration" },
      { p: "Qual o ponto mais alto do Brasil?", v: "Pico da Neblina", f: ["Pico da Bandeira", "Monte Roraima", "Pico do Itatiaia"], img: "mountain peak above clouds in Brazil" },
      { p: "De que país é originário o sushi?", v: "Japão", f: ["China", "Coreia", "Tailândia"], img: "sushi platter with salmon and tuna" },
      { p: "Qual é o gás mais abundante na atmosfera?", v: "Nitrogênio", f: ["Oxigênio", "Gás Carbônico", "Argônio"], img: "Earth atmosphere layers from space" },
      { p: "Quantos planetas tem o Sistema Solar?", v: "8 planetas", f: ["9 planetas", "7 planetas", "10 planetas"], img: "solar system planets in order from the sun" }
    ],
    dificil: [
      { p: "Qual é o elemento químico com número atômico 79?", v: "Ouro (Au)", f: ["Prata (Ag)", "Platina (Pt)", "Cobre (Cu)"], img: "gold bars stacked in a vault" },
      { p: "Quem foi o primeiro presidente do Brasil?", v: "Deodoro da Fonseca", f: ["Floriano Peixoto", "Prudente de Morais", "Dom Pedro II"], img: "old Brazilian Republic historical photo" },
      { p: "Qual é a distância da Terra ao Sol em km?", v: "~150 milhões km", f: ["~100 milhões km", "~200 milhões km", "~50 milhões km"], img: "Earth and Sun distance diagram in space" },
      { p: "Qual país tem mais fusos horários?", v: "França", f: ["Rússia", "EUA", "China"], img: "world map with time zones highlighted" },
      { p: "Qual civilização inventou o zero como número?", v: "Civilização Maia", f: ["Egípcios", "Gregos", "Romanos"], img: "ancient Mayan ruins and number carvings" },
      { p: "Em que ano caiu o Muro de Berlim?", v: "1989", f: ["1991", "1987", "1985"], img: "Berlin Wall falling with crowd celebrating" },
      { p: "Qual osso humano é o mais longo?", v: "Fêmur", f: ["Úmero", "Tíbia", "Rádio"], img: "femur bone anatomical illustration" },
      { p: "Qual lago é o mais profundo do mundo?", v: "Lago Baikal", f: ["Lago Tanganica", "Lago Superior", "Lago Vitória"], img: "Lake Baikal crystal clear deep water" },
      { p: "Quem desenvolveu a teoria da relatividade?", v: "Albert Einstein", f: ["Isaac Newton", "Niels Bohr", "Max Planck"], img: "E equals mc squared formula on blackboard" },
      { p: "Qual é a velocidade da luz no vácuo?", v: "~300.000 km/s", f: ["~150.000 km/s", "~500.000 km/s", "~1.000.000 km/s"], img: "speed of light beams through prism" },
      { p: "Quantos cromossomos tem uma célula humana?", v: "46 cromossomos", f: ["48 cromossomos", "44 cromossomos", "42 cromossomos"], img: "human chromosomes under microscope" },
      { p: "Qual animal tem a gestação mais longa?", v: "Elefante (~22 meses)", f: ["Baleia azul", "Rinoceronte", "Girafa"], img: "elephant mother with baby in savanna" },
      { p: "Qual é o metal mais condutor de eletricidade?", v: "Prata", f: ["Cobre", "Ouro", "Alumínio"], img: "silver metal bars reflecting light" },
      { p: "Em qual país fica Machu Picchu?", v: "Peru", f: ["Bolívia", "Equador", "Colômbia"], img: "Machu Picchu ancient Inca ruins in Peru" },
      { p: "Qual o nome do processo de divisão celular?", v: "Mitose", f: ["Meiose", "Osmose", "Difusão"], img: "cell division mitosis stages microscope" }
    ],
    infernal: [
      { p: "Qual é o ponto mais profundo dos oceanos?", v: "Fossa das Marianas", f: ["Fossa de Tonga", "Fossa de Java", "Fossa de Porto Rico"], img: "deep ocean trench dark abyss underwater" },
      { p: "Qual é o único mamífero que realmente voa?", v: "Morcego", f: ["Esquilo-voador", "Colugo", "Sugar glider"], img: "bat flying at night with stars" },
      { p: "Em que ano Gutenberg inventou a prensa móvel?", v: "~1440", f: ["~1500", "~1380", "~1520"], img: "Gutenberg printing press vintage illustration" },
      { p: "Qual a língua com mais falantes nativos no mundo?", v: "Mandarim", f: ["Espanhol", "Inglês", "Hindi"], img: "Chinese mandarin characters calligraphy" },
      { p: "Qual é o paradoxo que envolve um gato em uma caixa?", v: "Paradoxo de Schrödinger", f: ["Paradoxo de Olbers", "Paradoxo de Fermi", "Paradoxo de Russell"], img: "cat in a mysterious box quantum physics" },
      { p: "Qual cor não faz parte do arco-íris?", v: "Rosa", f: ["Violeta", "Anil", "Laranja"], img: "vivid rainbow spectrum in the sky" },
      { p: "Quantas faces tem um icosaedro?", v: "20 faces", f: ["12 faces", "16 faces", "24 faces"], img: "geometric icosahedron 3D shape" },
      { p: "Qual cientista formulou as leis da termodinâmica?", v: "Rudolf Clausius", f: ["James Joule", "Lord Kelvin", "Sadi Carnot"], img: "thermodynamics equations and heat engine diagram" },
      { p: "Qual rio nasce na Cordilheira dos Andes e é o mais caudaloso?", v: "Rio Amazonas", f: ["Rio Paraná", "Rio Orinoco", "Rio São Francisco"], img: "Amazon River aerial view through rainforest" },
      { p: "Qual é o significado da sigla DNA em português?", v: "Ácido desoxirribonucleico", f: ["Ácido dinucleico", "Ácido diribonucleico", "Ácido desoxinucleico"], img: "DNA double helix 3D molecular structure" },
      { p: "Qual asteroide extinguiu os dinossauros?", v: "Chicxulub", f: ["Apophis", "Bennu", "Vesta"], img: "asteroid impacting Earth dinosaur extinction" },
      { p: "Qual é a unidade SI de pressão?", v: "Pascal (Pa)", f: ["Newton (N)", "Joule (J)", "Bar"], img: "pressure gauge measuring instrument" },
      { p: "Quem foi a primeira mulher a ganhar um Prêmio Nobel?", v: "Marie Curie", f: ["Rosalind Franklin", "Ada Lovelace", "Lise Meitner"], img: "Nobel Prize medal and scientific laboratory" },
      { p: "Qual o nome da galáxia mais próxima da Via Láctea?", v: "Andrômeda", f: ["Triângulo", "Sagitário Anã", "Magalhães"], img: "Andromeda galaxy in the night sky" },
      { p: "Quantas luas tem Júpiter (aproximadamente)?", v: "~95 luas", f: ["~60 luas", "~30 luas", "~120 luas"], img: "Jupiter planet with its many moons" }
    ]
  },

  // ============================
  // 📜 HISTÓRIA E GEOGRAFIA
  // ============================
  historia: {
    facil: [
      { p: "Quem descobriu o Brasil?", v: "Pedro Álvares Cabral", f: ["Cristóvão Colombo", "Vasco da Gama", "Fernão de Magalhães"], img: "Portuguese ships arriving at Brazilian coast 1500" },
      { p: "Qual é a capital do Brasil?", v: "Brasília", f: ["São Paulo", "Rio de Janeiro", "Salvador"], img: "Brasilia Cathedral modern architecture" },
      { p: "Qual é o continente mais frio?", v: "Antártica", f: ["Ártico", "Europa", "Ásia"], img: "Antarctica ice landscape with penguins" },
      { p: "Em qual país fica a Torre Eiffel?", v: "França", f: ["Itália", "Espanha", "Inglaterra"], img: "Eiffel Tower in Paris at golden hour" },
      { p: "Qual é o maior país do mundo em área?", v: "Rússia", f: ["Canadá", "China", "EUA"], img: "Russian landscape vast territory map" },
      { p: "Qual civilização construiu as pirâmides de Gizé?", v: "Egípcios", f: ["Maias", "Romanos", "Gregos"], img: "Egyptian pyramids of Giza at sunset" },
      { p: "Qual é a capital da Argentina?", v: "Buenos Aires", f: ["Montevidéu", "Santiago", "Lima"], img: "Buenos Aires colorful La Boca neighborhood" },
      { p: "Em que continente fica o Egito?", v: "África", f: ["Ásia", "Europa", "Oceania"], img: "Egypt Nile River with pyramids background" },
      { p: "Qual país é famoso pela Grande Muralha?", v: "China", f: ["Japão", "Mongólia", "Índia"], img: "Great Wall of China aerial view" },
      { p: "Qual é a maior ilha do mundo?", v: "Groenlândia", f: ["Madagascar", "Borneo", "Austrália"], img: "Greenland ice sheet aerial view" },
      { p: "Quem foi o imperador que governou o Brasil?", v: "Dom Pedro II", f: ["Dom Pedro I", "Dom João VI", "Napoleão"], img: "Brazilian Empire crown and throne" },
      { p: "Qual é o idioma oficial de Portugal?", v: "Português", f: ["Espanhol", "Francês", "Italiano"], img: "Lisbon Portugal colorful tiled buildings" },
      { p: "Qual animal está na bandeira do Sri Lanka?", v: "Leão", f: ["Tigre", "Elefante", "Águia"], img: "Sri Lanka flag with golden lion" },
      { p: "Qual é o mar entre a Europa e a África?", v: "Mar Mediterrâneo", f: ["Mar Vermelho", "Mar Negro", "Mar do Norte"], img: "Mediterranean Sea blue coastline from above" },
      { p: "Em que guerra aconteceu a Batalha de Stalingrado?", v: "Segunda Guerra Mundial", f: ["Primeira Guerra", "Guerra Fria", "Guerra do Vietnã"], img: "World War II battle scene historical photo" }
    ],
    medio: [
      { p: "Qual império construiu o Coliseu de Roma?", v: "Império Romano", f: ["Império Grego", "Império Bizantino", "Império Persa"], img: "Roman Colosseum ancient architecture" },
      { p: "Em que ano acabou a Primeira Guerra Mundial?", v: "1918", f: ["1916", "1920", "1914"], img: "World War I trenches historical photo" },
      { p: "Qual civilização inventou a democracia?", v: "Grega (Atenas)", f: ["Romana", "Egípcia", "Persa"], img: "ancient Greek Parthenon in Athens" },
      { p: "Qual é a capital da Turquia?", v: "Ancara", f: ["Istambul", "Antalya", "Izmir"], img: "Ankara Turkey modern cityscape" },
      { p: "Qual país foi dividido pelo Muro de Berlim?", v: "Alemanha", f: ["Polônia", "Áustria", "Tchecoslováquia"], img: "Berlin Wall historical graffiti art" },
      { p: "Qual era o nome do navio que afundou em 1912?", v: "Titanic", f: ["Lusitânia", "Bismarck", "Britannic"], img: "Titanic ship sailing on the ocean" },
      { p: "Qual explorador completou a primeira volta ao mundo?", v: "Fernão de Magalhães", f: ["Cristóvão Colombo", "Vasco da Gama", "James Cook"], img: "old sailing ship circumnavigating the globe" },
      { p: "Em qual continente fica o Monte Kilimanjaro?", v: "África", f: ["Ásia", "América do Sul", "Europa"], img: "Mount Kilimanjaro snow peak above clouds" },
      { p: "Quem foi o líder da Revolução Francesa?", v: "Robespierre", f: ["Napoleão", "Luís XVI", "Voltaire"], img: "French Revolution storming the Bastille" },
      { p: "Qual é o rio mais importante do Egito?", v: "Rio Nilo", f: ["Rio Tigre", "Rio Eufrates", "Rio Jordão"], img: "Nile River flowing through Egyptian landscape" },
      { p: "Quantos estados tem o Brasil?", v: "26 estados + DF", f: ["25 estados", "27 estados + DF", "24 estados + DF"], img: "Brazil map with states highlighted" },
      { p: "Qual tratado dividiu o Novo Mundo entre Portugal e Espanha?", v: "Tratado de Tordesilhas", f: ["Tratado de Madrid", "Tratado de Utrecht", "Tratado de Versalhes"], img: "old world map with treaty line dividing the globe" },
      { p: "Qual país é famoso pelos Vikings?", v: "Noruega/Escandinávia", f: ["Inglaterra", "Alemanha", "Rússia"], img: "Viking longship sailing in Nordic fjord" },
      { p: "Qual cidade antiga foi destruída pelo Vesúvio?", v: "Pompeia", f: ["Roma", "Atenas", "Cartago"], img: "Pompeii ruins with Vesuvius volcano background" },
      { p: "Qual é o estreito que separa a Europa da Ásia?", v: "Estreito de Bósforo", f: ["Estreito de Gibraltar", "Canal de Suez", "Estreito de Malaca"], img: "Bosphorus Strait Istanbul cityscape" }
    ],
    dificil: [
      { p: "Qual foi a última dinastia imperial da China?", v: "Dinastia Qing", f: ["Dinastia Ming", "Dinastia Han", "Dinastia Tang"], img: "Chinese Forbidden City imperial palace" },
      { p: "Em que ano Constantinopla caiu para os Otomanos?", v: "1453", f: ["1492", "1399", "1520"], img: "Constantinople siege Ottoman Empire historical" },
      { p: "Qual era o nome original de Nova York?", v: "Nova Amsterdã", f: ["Nova Londres", "Nova Lisboa", "Nova Paris"], img: "old New Amsterdam Dutch colonial settlement" },
      { p: "Qual era a capital do Império Inca?", v: "Cusco", f: ["Quito", "Lima", "La Paz"], img: "Cusco ancient Inca stone walls Peru" },
      { p: "Em que ano os portugueses chegaram ao Japão?", v: "1543", f: ["1500", "1600", "1450"], img: "Portuguese traders arriving in feudal Japan" },
      { p: "Qual foi o tratado que encerrou a I Guerra Mundial?", v: "Tratado de Versalhes", f: ["Tratado de Paris", "Tratado de Viena", "Tratado de Ghent"], img: "Versailles Palace Hall of Mirrors treaty signing" },
      { p: "Qual civilização criou a escrita cuneiforme?", v: "Sumérios", f: ["Egípcios", "Fenícios", "Babilônios"], img: "Sumerian cuneiform clay tablet ancient writing" },
      { p: "Qual imperador romano legalizou o cristianismo?", v: "Constantino", f: ["Augusto", "Nero", "Trajano"], img: "Emperor Constantine Roman Empire mosaic" },
      { p: "Qual país europeu colonizou o Congo?", v: "Bélgica", f: ["França", "Inglaterra", "Holanda"], img: "colonial era Congo historical map" },
      { p: "Qual batalha marcou o fim de Napoleão?", v: "Batalha de Waterloo", f: ["Batalha de Trafalgar", "Batalha de Austerlitz", "Batalha de Leipzig"], img: "Waterloo battlefield historical painting" },
      { p: "Qual civilização construiu Angkor Wat?", v: "Império Khmer", f: ["Império Mongol", "Dinastia Han", "Império Gupta"], img: "Angkor Wat temple at sunrise Cambodia" },
      { p: "Qual era o nome do último czar da Rússia?", v: "Nicolau II", f: ["Alexandre III", "Pedro, o Grande", "Ivan IV"], img: "Russian Tsar crown and imperial palace" },
      { p: "Qual foi a primeira capital dos EUA?", v: "Nova York", f: ["Filadélfia", "Boston", "Washington"], img: "New York City 18th century historical illustration" },
      { p: "Qual vulcão destruiu Pompeia?", v: "Monte Vesúvio", f: ["Monte Etna", "Monte Olimpo", "Krakatoa"], img: "Mount Vesuvius erupting with lava and ash" },
      { p: "Qual rei francês foi guilhotinado na Revolução?", v: "Luís XVI", f: ["Luís XIV", "Luís XV", "Carlos X"], img: "French Revolution guillotine historical scene" }
    ],
    infernal: [
      { p: "Qual povo construiu a cidade de Tiwanaku nos Andes?", v: "Cultura Tiwanaku", f: ["Incas", "Maias", "Nazca"], img: "Tiwanaku ruins ancient stone gateway Bolivia" },
      { p: "Em que século viveu Genghis Khan?", v: "Século XII-XIII", f: ["Século X-XI", "Século XIV-XV", "Século VIII-IX"], img: "Mongolian warriors on horseback vast steppe" },
      { p: "Qual foi o nome do primeiro satélite artificial?", v: "Sputnik 1", f: ["Explorer 1", "Vanguard 1", "Luna 1"], img: "Sputnik satellite orbiting Earth in space" },
      { p: "Qual civilização criou o calendário de 365 dias?", v: "Egípcios", f: ["Maias", "Romanos", "Gregos"], img: "ancient Egyptian hieroglyphics and calendar" },
      { p: "Qual imperador romano dividiu o império em dois?", v: "Diocleciano", f: ["Constantino", "Teodósio", "Augusto"], img: "Roman Empire divided East West historical map" },
      { p: "Qual é a cordilheira mais longa do mundo?", v: "Cordilheira dos Andes", f: ["Himalaia", "Montanhas Rochosas", "Alpes"], img: "Andes mountain range stretching aerial view" },
      { p: "Qual filósofo grego foi mestre de Alexandre, o Grande?", v: "Aristóteles", f: ["Platão", "Sócrates", "Pitágoras"], img: "ancient Greek philosopher teaching in academy" },
      { p: "Qual império controlava a Mesopotâmia antes de Alexandre?", v: "Império Persa", f: ["Império Assírio", "Império Babilônico", "Império Hitita"], img: "Persian Empire Persepolis ancient ruins" },
      { p: "Qual país africano nunca foi colonizado por europeus?", v: "Etiópia", f: ["Libéria", "Marrocos", "Egito"], img: "Ethiopian ancient Lalibela rock churches" },
      { p: "Qual era o nome do sistema feudal japonês?", v: "Bakufu (Shogunato)", f: ["Daimyo", "Bushido", "Zaibatsu"], img: "feudal Japan samurai castle and armor" },
      { p: "Qual tratado criou as fronteiras modernas do Oriente Médio?", v: "Sykes-Picot (1916)", f: ["Balfour (1917)", "Camp David", "Oslo (1993)"], img: "Middle East historical map colonial borders" },
      { p: "Qual imperador construiu a Muralha de Adriano?", v: "Adriano", f: ["Trajano", "Marco Aurélio", "Tibério"], img: "Hadrians Wall ancient Roman fortification Britain" },
      { p: "Qual terremoto destruiu Lisboa em 1755?", v: "Grande Terremoto de Lisboa", f: ["Terremoto de Messina", "Terremoto de Kantō", "Terremoto de San Francisco"], img: "Lisbon earthquake 1755 historical destruction painting" },
      { p: "Qual povo criou o primeiro código de leis escrito?", v: "Babilônios (Hamurabi)", f: ["Sumérios", "Egípcios", "Romanos"], img: "Code of Hammurabi ancient stone stele" },
      { p: "Qual a capital do Sacro Império Romano-Germânico?", v: "Não tinha capital fixa", f: ["Viena", "Berlim", "Praga"], img: "Holy Roman Empire crown jewels medieval" }
    ]
  },

  // ============================
  // 🔬 CIÊNCIAS E EXATAS
  // ============================
  ciencia: {
    facil: [
      { p: "Qual é o centro do Sistema Solar?", v: "O Sol", f: ["A Terra", "A Lua", "Júpiter"], img: "bright sun in space solar system center" },
      { p: "Qual gás nós respiramos para viver?", v: "Oxigênio", f: ["Nitrogênio", "Hidrogênio", "Hélio"], img: "oxygen molecules floating in blue sky" },
      { p: "Qual é o estado da água quando ferve?", v: "Gasoso (vapor)", f: ["Líquido", "Sólido", "Plasma"], img: "boiling water with steam rising from pot" },
      { p: "Os dinossauros eram répteis ou mamíferos?", v: "Répteis", f: ["Mamíferos", "Anfíbios", "Aves"], img: "dinosaur T-Rex in prehistoric jungle" },
      { p: "Quantas patas tem um inseto?", v: "6 patas", f: ["8 patas", "4 patas", "10 patas"], img: "insect beetle with six legs macro photo" },
      { p: "Qual planeta tem anéis visíveis?", v: "Saturno", f: ["Júpiter", "Urano", "Netuno"], img: "Saturn planet with beautiful rings in space" },
      { p: "Qual parte do corpo bombeia o sangue?", v: "Coração", f: ["Pulmão", "Fígado", "Cérebro"], img: "human heart pumping blood medical illustration" },
      { p: "Qual é a estrela mais próxima da Terra?", v: "O Sol", f: ["Proxima Centauri", "Sirius", "Alfa Centauri"], img: "Sun star close-up with solar flares" },
      { p: "Do que são feitas as nuvens?", v: "Gotículas de água", f: ["Algodão", "Fumaça", "Poeira"], img: "white clouds in blue sky close-up" },
      { p: "Qual gás as plantas absorvem?", v: "Gás Carbônico (CO2)", f: ["Oxigênio", "Nitrogênio", "Hélio"], img: "green plant absorbing sunlight photosynthesis" },
      { p: "Qual é a força que nos mantém no chão?", v: "Gravidade", f: ["Magnetismo", "Atrito", "Inércia"], img: "apple falling from tree Newton gravity" },
      { p: "O DNA fica dentro de qual estrutura celular?", v: "Núcleo", f: ["Mitocôndria", "Ribossomo", "Membrana"], img: "cell nucleus with DNA chromosomes illustration" },
      { p: "Qual é o maior planeta do Sistema Solar?", v: "Júpiter", f: ["Saturno", "Urano", "Netuno"], img: "Jupiter giant planet in space with moons" },
      { p: "Qual tipo de rocha é formada por lava vulcânica?", v: "Ígnea", f: ["Sedimentar", "Metamórfica", "Calcária"], img: "volcanic lava cooling into igneous rock" },
      { p: "Qual animal é conhecido por mudar de cor?", v: "Camaleão", f: ["Polvo", "Sapo", "Lagarto"], img: "chameleon changing colors on branch" }
    ],
    medio: [
      { p: "Qual é a unidade de medida de corrente elétrica?", v: "Ampère", f: ["Volt", "Watt", "Ohm"], img: "electrical current flowing through copper wire" },
      { p: "Qual é o elemento mais abundante no universo?", v: "Hidrogênio", f: ["Hélio", "Oxigênio", "Carbono"], img: "hydrogen atoms in nebula outer space" },
      { p: "O que mede a Escala Richter?", v: "Magnitude de terremotos", f: ["Velocidade do vento", "Temperatura", "Intensidade de furacões"], img: "seismograph recording earthquake vibrations" },
      { p: "Qual organela é a 'usina de energia' da célula?", v: "Mitocôndria", f: ["Ribossomo", "Lisossomo", "Complexo de Golgi"], img: "mitochondria cell organelle 3D illustration" },
      { p: "Qual é a velocidade do som no ar?", v: "~343 m/s", f: ["~500 m/s", "~200 m/s", "~700 m/s"], img: "sound waves visualized in air" },
      { p: "Qual cientista descobriu a penicilina?", v: "Alexander Fleming", f: ["Louis Pasteur", "Robert Koch", "Edward Jenner"], img: "penicillin mold growing in petri dish" },
      { p: "Qual planeta é o mais quente do Sistema Solar?", v: "Vênus", f: ["Mercúrio", "Marte", "Júpiter"], img: "Venus planet hot surface from space" },
      { p: "O que é um ano-luz?", v: "Unidade de distância", f: ["Unidade de tempo", "Unidade de velocidade", "Unidade de energia"], img: "starlight traveling through deep space" },
      { p: "Qual ácido está presente no estômago?", v: "Ácido clorídrico", f: ["Ácido sulfúrico", "Ácido acético", "Ácido nítrico"], img: "stomach acid digestion medical illustration" },
      { p: "Qual partícula tem carga elétrica negativa?", v: "Elétron", f: ["Próton", "Nêutron", "Fóton"], img: "electron orbiting atom 3D illustration" },
      { p: "O que causa as marés?", v: "Gravidade da Lua", f: ["Rotação da Terra", "Vento", "Gravidade do Sol"], img: "moon causing ocean tides at coast" },
      { p: "Quantos estados da matéria existem comumente?", v: "4 (sólido/líquido/gasoso/plasma)", f: ["3 estados", "5 estados", "2 estados"], img: "four states of matter diagram illustration" },
      { p: "Qual tipo sanguíneo é o doador universal?", v: "O negativo", f: ["AB positivo", "A positivo", "B negativo"], img: "blood type compatibility chart medical" },
      { p: "Qual é o símbolo químico do ferro?", v: "Fe", f: ["Fr", "Fi", "Ir"], img: "iron Fe element periodic table close-up" },
      { p: "O que significa pH?", v: "Potencial hidrogeniônico", f: ["Potência do hidrogênio", "Peso do hidrogênio", "Pressão hidrostática"], img: "pH scale from acid to alkaline colorful" }
    ],
    dificil: [
      { p: "Qual é a constante de Planck aproximada?", v: "6,626 × 10⁻³⁴ J·s", f: ["3,14 × 10⁻³⁴ J·s", "9,81 × 10⁻³⁴ J·s", "1,38 × 10⁻²³ J·s"], img: "quantum physics Planck constant equation" },
      { p: "Qual enzima inicia a digestão do amido na boca?", v: "Amilase salivar", f: ["Pepsina", "Lipase", "Tripsina"], img: "salivary glands mouth anatomy illustration" },
      { p: "Qual partícula subatômica foi descoberta no CERN em 2012?", v: "Bóson de Higgs", f: ["Gluon", "Quark Top", "Neutrino"], img: "CERN Large Hadron Collider particle collision" },
      { p: "Qual é o processo pelo qual estrelas geram energia?", v: "Fusão nuclear", f: ["Fissão nuclear", "Combustão", "Radiação"], img: "nuclear fusion inside a star cross section" },
      { p: "Qual é o número de Avogadro?", v: "6,022 × 10²³", f: ["3,14 × 10²³", "6,022 × 10²⁰", "9,81 × 10²³"], img: "Avogadro number molecules collection 3D" },
      { p: "Qual vitamina é essencial para coagulação sanguínea?", v: "Vitamina K", f: ["Vitamina C", "Vitamina E", "Vitamina B6"], img: "blood coagulation cascade medical diagram" },
      { p: "Qual é o princípio da incerteza?", v: "Heisenberg", f: ["Schrödinger", "Bohr", "Dirac"], img: "uncertainty principle wave particle duality" },
      { p: "Qual camada da atmosfera contém a camada de ozônio?", v: "Estratosfera", f: ["Troposfera", "Mesosfera", "Termosfera"], img: "Earth atmosphere ozone layer diagram" },
      { p: "Qual tipo de ligação química ocorre entre NaCl?", v: "Ligação iônica", f: ["Ligação covalente", "Ligação metálica", "Ligação de hidrogênio"], img: "sodium chloride ionic bond crystal structure" },
      { p: "Qual é a galáxia onde está o Sistema Solar?", v: "Via Láctea", f: ["Andrômeda", "Triângulo", "Magalhães"], img: "Milky Way galaxy spiral arms from outside" },
      { p: "Qual físico propôs o modelo atômico planetário?", v: "Rutherford", f: ["Bohr", "Thomson", "Dalton"], img: "Rutherford atom model gold foil experiment" },
      { p: "Qual é o ponto de ebulição da água em Kelvin?", v: "373 K", f: ["273 K", "100 K", "473 K"], img: "water boiling thermometer temperature scale" },
      { p: "Qual estrutura celular faz a fotossíntese?", v: "Cloroplasto", f: ["Mitocôndria", "Ribossomo", "Lisossomo"], img: "chloroplast inside plant cell 3D illustration" },
      { p: "O que a Lei de Ohm relaciona?", v: "Tensão, corrente e resistência", f: ["Pressão e volume", "Massa e aceleração", "Energia e frequência"], img: "Ohms law formula V equals IR circuit" },
      { p: "Qual é o antimatéria do elétron?", v: "Pósitron", f: ["Antipróton", "Antinêutron", "Fóton"], img: "matter antimatter annihilation particle physics" }
    ],
    infernal: [
      { p: "Qual é a frequência de vibração do césio-133 no relógio atômico?", v: "9.192.631.770 Hz", f: ["4.500.000.000 Hz", "12.000.000.000 Hz", "6.000.000.000 Hz"], img: "atomic clock cesium oscillation precision" },
      { p: "Qual é o segundo elemento mais eletronegativo?", v: "Oxigênio", f: ["Cloro", "Nitrogênio", "Flúor"], img: "periodic table electronegativity scale" },
      { p: "Qual partícula quase não interage com a matéria?", v: "Neutrino", f: ["Fóton", "Gluon", "Múon"], img: "neutrino passing through matter detector" },
      { p: "Qual é o teorema que diz que toda simetria tem uma lei de conservação?", v: "Teorema de Noether", f: ["Teorema de Gauss", "Teorema de Fermat", "Teorema de Gödel"], img: "mathematical symmetry abstract physics equations" },
      { p: "Qual é o maior número primo de Mersenne conhecido (tipo)?", v: "2^p - 1", f: ["p^2 + 1", "2p + 3", "p! - 1"], img: "prime numbers mathematical formula on blackboard" },
      { p: "Qual mecanismo permite que proteínas cruzem membranas?", v: "Translocação", f: ["Osmose", "Difusão", "Plasmólise"], img: "protein crossing cell membrane 3D biology" },
      { p: "Qual efeito explica a expansão acelerada do universo?", v: "Energia escura", f: ["Matéria escura", "Inflação cósmica", "Radiação de fundo"], img: "dark energy expanding universe cosmic web" },
      { p: "Qual é o nome da equação que descreve ondas quânticas?", v: "Equação de Schrödinger", f: ["Equação de Maxwell", "Equação de Dirac", "Equação de Boltzmann"], img: "Schrodinger equation quantum wave function" },
      { p: "Qual constante universal vale ~6,674 × 10⁻¹¹?", v: "Constante gravitacional G", f: ["Constante de Boltzmann", "Constante de Planck", "Carga elementar"], img: "gravitational constant G Newton formula" },
      { p: "Qual estrutura do DNA conecta as bases nitrogenadas?", v: "Pontes de hidrogênio", f: ["Ligações covalentes", "Ligações iônicas", "Forças de Van der Waals"], img: "DNA base pairs hydrogen bonds structure" },
      { p: "Qual efeito faz a luz curvar perto de um buraco negro?", v: "Lente gravitacional", f: ["Efeito Doppler", "Efeito Compton", "Aberração óptica"], img: "gravitational lensing around black hole space" },
      { p: "Qual é a menor escala de comprimento com significado físico?", v: "Comprimento de Planck", f: ["Raio de Bohr", "Comprimento de Compton", "Raio clássico do elétron"], img: "Planck length scale quantum foam diagram" },
      { p: "Qual aminoácido é o único que não tem quiralidade?", v: "Glicina", f: ["Alanina", "Prolina", "Valina"], img: "glycine amino acid molecular structure 3D" },
      { p: "Qual fenômeno Einstein chamou de 'ação fantasmagórica à distância'?", v: "Entrelaçamento quântico", f: ["Superposição", "Tunelamento", "Decoerência"], img: "quantum entanglement two particles connected" },
      { p: "Qual é a temperatura do zero absoluto em Celsius?", v: "-273,15 °C", f: ["-300 °C", "-250 °C", "-200 °C"], img: "absolute zero temperature frozen molecules" }
    ]
  },

  // ============================
  // 👾 GEEK E JOGOS
  // ============================
  geek: {
    facil: [
      { p: "Qual é o nome do encanador da Nintendo?", v: "Mario", f: ["Luigi", "Wario", "Toad"], img: "red mushroom and green pipe pixel art game" },
      { p: "Qual é o nome do bloco amarelo do Minecraft?", v: "Areia", f: ["Ouro", "Arenito", "Esponja"], img: "Minecraft blocky desert landscape" },
      { p: "Em qual filme aparece o Darth Vader?", v: "Star Wars", f: ["Star Trek", "Guardiões da Galáxia", "Matrix"], img: "Star Wars dark side villain black helmet" },
      { p: "Qual herói é conhecido como o Homem de Ferro?", v: "Tony Stark", f: ["Bruce Wayne", "Peter Parker", "Steve Rogers"], img: "red and gold iron suit futuristic armor" },
      { p: "Qual é o nome do anime sobre piratas buscando um tesouro?", v: "One Piece", f: ["Naruto", "Bleach", "Dragon Ball"], img: "pirate ship anime style sailing adventure" },
      { p: "Quantos jogadores tem um time de futebol no videogame FIFA?", v: "11 jogadores", f: ["10 jogadores", "12 jogadores", "9 jogadores"], img: "soccer video game screenshot stadium" },
      { p: "Qual console é fabricado pela Sony?", v: "PlayStation", f: ["Xbox", "Nintendo Switch", "Steam Deck"], img: "gaming console controller with buttons" },
      { p: "Qual é a cor do personagem Sonic?", v: "Azul", f: ["Vermelho", "Verde", "Amarelo"], img: "blue hedgehog running fast cartoon style" },
      { p: "Qual personagem fica grande ao comer um cogumelo?", v: "Mario", f: ["Sonic", "Link", "Pac-Man"], img: "red mushroom power-up pixel art game" },
      { p: "De que franquia é o personagem Pikachu?", v: "Pokémon", f: ["Digimon", "Yu-Gi-Oh", "Bakugan"], img: "yellow electric mouse creature cute anime" },
      { p: "Qual jogo tem creepers que explodem?", v: "Minecraft", f: ["Terraria", "Roblox", "Fortnite"], img: "green blocky creeper mob pixel art" },
      { p: "Qual vilão é o arqui-inimigo do Batman?", v: "Coringa", f: ["Lex Luthor", "Thanos", "Magneto"], img: "playing card joker dark villain art" },
      { p: "Qual é o objetivo do jogo Tetris?", v: "Encaixar peças geométricas", f: ["Matar inimigos", "Construir casas", "Coletar moedas"], img: "colorful Tetris blocks falling game" },
      { p: "Qual é o nome do mago de Senhor dos Anéis?", v: "Gandalf", f: ["Dumbledore", "Merlin", "Saruman"], img: "wizard with staff and hat fantasy setting" },
      { p: "Em que filme há humanos vivendo com robôs gigantes?", v: "Transformers", f: ["Matrix", "Terminator", "Blade Runner"], img: "giant robot transforming in a city" }
    ],
    medio: [
      { p: "Qual é o nome da espada lendária de Link em Zelda?", v: "Master Sword", f: ["Excalibur", "Blade of Evil's Bane", "Hylian Sword"], img: "legendary sword stuck in stone forest clearing" },
      { p: "Qual jogo popularizou o gênero Battle Royale?", v: "PUBG", f: ["Fortnite", "Apex Legends", "H1Z1"], img: "battle royale parachuting from plane aerial view" },
      { p: "Qual é o verdadeiro nome do Wolverine?", v: "Logan / James Howlett", f: ["Wade Wilson", "Scott Summers", "Victor Creed"], img: "adamantium claws slashing through metal" },
      { p: "Qual estúdio criou o jogo The Witcher 3?", v: "CD Projekt Red", f: ["Bethesda", "BioWare", "Rockstar"], img: "medieval fantasy witcher dark forest" },
      { p: "Qual é o nome do planeta natal de Superman?", v: "Krypton", f: ["Marte", "Namek", "Asgard"], img: "alien planet exploding crystal architecture" },
      { p: "Quem é o protagonista de God of War (2018)?", v: "Kratos", f: ["Atreus", "Thor", "Baldur"], img: "spartan warrior with axe in Norse setting" },
      { p: "Qual anime tem personagens com 'Stands'?", v: "JoJo's Bizarre Adventure", f: ["Naruto", "Bleach", "Hunter x Hunter"], img: "bizarre adventure stand spirit power anime style" },
      { p: "Qual empresa criou o sistema operacional Windows?", v: "Microsoft", f: ["Apple", "Google", "IBM"], img: "Windows logo computer screen boot" },
      { p: "Qual jogo MMORPG se passa no mundo de Azeroth?", v: "World of Warcraft", f: ["Final Fantasy XIV", "Guild Wars 2", "Elder Scrolls Online"], img: "fantasy world Azeroth castle landscape" },
      { p: "Qual personagem do Mario é um dinossauro verde?", v: "Yoshi", f: ["Koopa", "Bowser Jr", "Birdo"], img: "green dinosaur friendly cartoon character" },
      { p: "Qual é o nome do protocolo que move a internet?", v: "TCP/IP", f: ["HTTP", "FTP", "SMTP"], img: "network cables and servers data center" },
      { p: "Qual franquia tem a frase 'É perigoso ir sozinho'?", v: "The Legend of Zelda", f: ["Dark Souls", "Skyrim", "Elden Ring"], img: "old cave entrance with mysterious sword" },
      { p: "Qual estúdio japonês criou Street Fighter?", v: "Capcom", f: ["Konami", "Sega", "Bandai Namco"], img: "fighting game arcade cabinet retro neon" },
      { p: "Qual é o personagem jogável mais antigo do Super Smash Bros?", v: "Mario", f: ["Donkey Kong", "Link", "Samus"], img: "fighting game characters crossover battle" },
      { p: "Qual linguagem de programação tem uma cobra como logo?", v: "Python", f: ["Java", "Ruby", "Go"], img: "Python programming language logo snake icon" }
    ],
    dificil: [
      { p: "Qual é o nome do sistema de magia em Fullmetal Alchemist?", v: "Alquimia", f: ["Ninjutsu", "Haki", "Nen"], img: "alchemy transmutation circle glowing symbols" },
      { p: "Qual jogo indie tem a frase 'You are filled with determination'?", v: "Undertale", f: ["Hollow Knight", "Celeste", "Shovel Knight"], img: "pixelated underground cave retro game style" },
      { p: "Qual GPU é mais potente: RTX 4090 ou RX 7900 XTX?", v: "RTX 4090", f: ["RX 7900 XTX", "São iguais", "Depende do jogo"], img: "powerful gaming GPU graphics card with fans" },
      { p: "Qual foi o primeiro console de videogame doméstico?", v: "Magnavox Odyssey", f: ["Atari 2600", "Nintendo NES", "Fairchild Channel F"], img: "retro vintage first video game console" },
      { p: "Qual protocolo garante criptografia na web?", v: "TLS/SSL (HTTPS)", f: ["HTTP", "FTP", "SMTP"], img: "encrypted secure connection padlock website" },
      { p: "Qual personagem de ficção disse 'Eu sou inevitável'?", v: "Thanos", f: ["Darth Vader", "Voldemort", "Sauron"], img: "golden gauntlet with infinity stones" },
      { p: "Qual jogo FromSoftware foi eleito GOTY 2022?", v: "Elden Ring", f: ["Sekiro", "God of War Ragnarök", "Stray"], img: "dark fantasy landscape golden tree world" },
      { p: "Qual ataque é super-efetivo contra tipo Fogo em Pokémon?", v: "Tipo Água", f: ["Tipo Grama", "Tipo Elétrico", "Tipo Normal"], img: "water splash extinguishing fire battle scene" },
      { p: "Qual é o nome do criador de Linux?", v: "Linus Torvalds", f: ["Richard Stallman", "Dennis Ritchie", "Ken Thompson"], img: "Linux penguin Tux mascot on computer" },
      { p: "Qual anime é sobre um caderno que mata?", v: "Death Note", f: ["Tokyo Ghoul", "Parasyte", "Another"], img: "mysterious black notebook with gothic pen" },
      { p: "Qual é o nome do sistema de poder em Hunter x Hunter?", v: "Nen", f: ["Chakra", "Ki", "Haki"], img: "aura energy power system anime style" },
      { p: "Qual é a arquitetura de processador usada em smartphones?", v: "ARM", f: ["x86", "MIPS", "RISC-V"], img: "smartphone CPU chip architecture close-up" },
      { p: "Em qual jogo Geralt de Rivia é o protagonista?", v: "The Witcher", f: ["Skyrim", "Dark Souls", "Dragon Age"], img: "medieval monster hunter with silver sword" },
      { p: "Qual é o nome do maior torneio de League of Legends?", v: "Worlds", f: ["MSI", "LCS Finals", "All-Stars"], img: "esports tournament grand stage with trophy" },
      { p: "Qual manga tem o protagonista chamado Tanjiro?", v: "Demon Slayer", f: ["Jujutsu Kaisen", "My Hero Academia", "Chainsaw Man"], img: "samurai with checkered haori slaying demons" }
    ],
    infernal: [
      { p: "Qual foi o bug mais famoso do Pac-Man que trava o jogo?", v: "Nível 256 (kill screen)", f: ["Nível 100", "Nível 999", "Nível 128"], img: "Pac-Man glitched corrupted screen retro arcade" },
      { p: "Qual é o DPS teórico máximo de um mago no WoW Classic?", v: "Depende da spec (Fogo)", f: ["Gelo sempre", "Arcano sempre", "Shadow sempre"], img: "WoW mage casting fire spell in raid" },
      { p: "Qual foi o primeiro vírus de computador amplamente distribuído?", v: "Brain (1986)", f: ["ILOVEYOU (2000)", "Morris Worm (1988)", "Melissa (1999)"], img: "vintage computer virus floppy disk 1980s" },
      { p: "Qual é a resolução exata de um display 4K UHD?", v: "3840 × 2160", f: ["4096 × 2160", "3440 × 1440", "2560 × 1440"], img: "4K UHD display resolution comparison chart" },
      { p: "Qual é o nome do easter egg mais antigo em videogames?", v: "Adventure (Atari 2600)", f: ["Pac-Man", "Space Invaders", "Donkey Kong"], img: "Atari 2600 Adventure game hidden room pixel" },
      { p: "Qual algoritmo de sorting tem complexidade O(n log n) no pior caso?", v: "Merge Sort", f: ["Quick Sort", "Bubble Sort", "Selection Sort"], img: "sorting algorithm visualization colorful bars" },
      { p: "Qual foi o apelido dado ao glitch de MissingNo em Pokémon?", v: "MissingNo", f: ["GlitchCity", "Bad Egg", "Decamark"], img: "glitched pixelated creature retro game boy" },
      { p: "Em Metal Gear, qual é o nome real de Snake?", v: "David (Solid Snake)", f: ["John", "Jack", "Adam"], img: "stealth military spy soldier with bandana" },
      { p: "Qual é a velocidade do clock base de um i9-13900K?", v: "3.0 GHz", f: ["3.5 GHz", "4.0 GHz", "2.5 GHz"], img: "Intel CPU processor chip top view" },
      { p: "Qual manga teve mais de 500 milhões de cópias vendidas?", v: "One Piece", f: ["Dragon Ball", "Naruto", "Golgo 13"], img: "pirate manga treasure adventure illustration" },
      { p: "Qual framework JavaScript foi criado pelo Facebook?", v: "React", f: ["Angular", "Vue.js", "Svelte"], img: "React logo code on dark IDE screen" },
      { p: "Qual é o nome do antagonista principal de Final Fantasy VII?", v: "Sephiroth", f: ["Kefka", "Ultimecia", "Exdeath"], img: "long silver haired villain with katana" },
      { p: "Qual foi a primeira linguagem de alto nível?", v: "Fortran (1957)", f: ["COBOL (1959)", "LISP (1958)", "BASIC (1964)"], img: "vintage computer punch cards programming" },
      { p: "Qual chip gráfico usava o PlayStation 1?", v: "GPU fabricada pela Sony/Toshiba", f: ["Nvidia NV1", "ATI Rage", "3dfx Voodoo"], img: "PlayStation 1 console retro gaming nostalgia" },
      { p: "Qual é o speedrun world record mais disputado da história?", v: "Super Mario Bros (NES)", f: ["Doom", "Minecraft", "Portal"], img: "speedrun timer retro NES game screen" }
    ]
  },

  // ============================
  // ⚽ ESPORTES
  // ============================
  esportes: {
    facil: [
      { p: "Quantos jogadores tem um time de futebol em campo?", v: "11 jogadores", f: ["10 jogadores", "12 jogadores", "9 jogadores"], img: "soccer team on green football field" },
      { p: "Qual país sediou a Copa do Mundo de 2014?", v: "Brasil", f: ["Alemanha", "Rússia", "África do Sul"], img: "World Cup 2014 Brazil stadium Maracana" },
      { p: "Qual esporte usa raquete e peteca?", v: "Badminton", f: ["Tênis", "Squash", "Padel"], img: "badminton shuttlecock and racket on court" },
      { p: "De quantos em quantos anos acontecem as Olimpíadas?", v: "4 em 4 anos", f: ["2 em 2 anos", "3 em 3 anos", "5 em 5 anos"], img: "Olympic rings five colors symbol" },
      { p: "Qual esporte é jogado com taco e bola no gelo?", v: "Hóquei no gelo", f: ["Curling", "Patinação", "Boliche"], img: "ice hockey stick and puck on ice rink" },
      { p: "Qual seleção de futebol é a maior vencedora de Copas?", v: "Brasil (5 títulos)", f: ["Alemanha", "Itália", "Argentina"], img: "World Cup trophy golden football" },
      { p: "Qual é o esporte nacional do Japão?", v: "Sumô", f: ["Judô", "Karatê", "Kendô"], img: "sumo wrestling match in traditional arena" },
      { p: "Qual esporte é jogado em uma piscina com gols?", v: "Polo aquático", f: ["Nado sincronizado", "Mergulho", "Natação"], img: "water polo match in swimming pool" },
      { p: "Qual atleta é famoso pelas 23 medalhas olímpicas em natação?", v: "Michael Phelps", f: ["Ian Thorpe", "Ryan Lochte", "Mark Spitz"], img: "swimming pool Olympic competition lanes" },
      { p: "Qual é a cor do cartão de expulsão no futebol?", v: "Vermelho", f: ["Amarelo", "Azul", "Verde"], img: "referee showing red card in soccer match" },
      { p: "Qual esporte é jogado com uma bola laranja e cesta?", v: "Basquete", f: ["Voleibol", "Handebol", "Futsal"], img: "basketball going through hoop net" },
      { p: "Qual Grand Slam de tênis é jogado na grama?", v: "Wimbledon", f: ["Roland Garros", "US Open", "Australian Open"], img: "Wimbledon grass tennis court with net" },
      { p: "Qual é o objetivo do golfe?", v: "Colocar bola no buraco com menos tacadas", f: ["Marcar gols", "Correr mais rápido", "Acertar alvos"], img: "golf ball on tee green course" },
      { p: "Qual esporte radical usa uma prancha nas ondas?", v: "Surfe", f: ["Skate", "Snowboard", "Windsurf"], img: "surfer riding a big ocean wave" },
      { p: "Quantos sets são jogados no máximo no vôlei?", v: "5 sets", f: ["3 sets", "4 sets", "6 sets"], img: "volleyball spike over the net" }
    ],
    medio: [
      { p: "Qual jogador de futebol tem mais Bolas de Ouro?", v: "Lionel Messi", f: ["Cristiano Ronaldo", "Neymar", "Modric"], img: "Ballon dOr golden ball trophy football" },
      { p: "Qual país inventou o críquete?", v: "Inglaterra", f: ["Índia", "Austrália", "Paquistão"], img: "cricket bat and ball on pitch" },
      { p: "Qual é a distância oficial de uma maratona?", v: "42,195 km", f: ["40 km", "45 km", "50 km"], img: "marathon runners crossing finish line" },
      { p: "Qual lutador de MMA ficou invicto por mais tempo?", v: "Khabib Nurmagomedov", f: ["Anderson Silva", "Jon Jones", "Georges St-Pierre"], img: "MMA octagon fighting ring cage" },
      { p: "Qual seleção venceu a Copa do Mundo de 2022?", v: "Argentina", f: ["França", "Brasil", "Croácia"], img: "Argentina World Cup 2022 celebration Qatar" },
      { p: "Em qual esporte se usa o termo 'ace'?", v: "Tênis", f: ["Golfe", "Basquete", "Vôlei"], img: "tennis serve ace powerful shot" },
      { p: "Qual piloto de F1 tem mais títulos mundiais?", v: "Lewis Hamilton / Schumacher (7)", f: ["Ayrton Senna", "Max Verstappen", "Alain Prost"], img: "Formula 1 race car on track at speed" },
      { p: "Qual é o recorde mundial dos 100m rasos?", v: "9,58 segundos (Usain Bolt)", f: ["9,69 segundos", "9,72 segundos", "9,49 segundos"], img: "sprinter running on track 100m race" },
      { p: "Em qual cidade foram as primeiras Olimpíadas modernas?", v: "Atenas (1896)", f: ["Paris (1900)", "Londres (1908)", "Estocolmo (1912)"], img: "ancient Greek Olympic stadium Athens" },
      { p: "Qual é a pontuação máxima no boliche?", v: "300 pontos", f: ["200 pontos", "250 pontos", "350 pontos"], img: "bowling perfect game strike pins" },
      { p: "Quantos jogadores tem um time de rugby?", v: "15 jogadores", f: ["11 jogadores", "13 jogadores", "10 jogadores"], img: "rugby scrum on grass field" },
      { p: "Qual país é potência no hóquei no gelo?", v: "Canadá", f: ["EUA", "Rússia", "Suécia"], img: "Canadian hockey team ice rink" },
      { p: "Qual é a principal competição de clubes europeus de futebol?", v: "UEFA Champions League", f: ["Europa League", "Copa do Rei", "Premier League"], img: "Champions League trophy starball football" },
      { p: "Qual modalidade de luta tem cinturão preto como referência?", v: "Judô / Karatê", f: ["Boxe", "MMA", "Muay Thai"], img: "martial arts black belt and gi uniform" },
      { p: "Qual evento automobilístico dura 24 horas?", v: "24 Horas de Le Mans", f: ["Daytona 500", "Indy 500", "Mônaco GP"], img: "Le Mans 24h race car at night" }
    ],
    dificil: [
      { p: "Qual jogador brasileiro ganhou 3 Copas do Mundo?", v: "Pelé", f: ["Ronaldo", "Garrincha", "Zico"], img: "old black and white World Cup celebration Brazil" },
      { p: "Qual é a altitude do campo do estádio mais alto do mundo?", v: "~6.000m (El Alto, Bolívia)", f: ["~4.000m", "~3.500m", "~5.000m"], img: "high altitude football stadium in mountains" },
      { p: "Qual técnica do judô é conhecida como 'arremesso de quadril'?", v: "O-goshi", f: ["Seoi-nage", "Uchi-mata", "Harai-goshi"], img: "judo hip throw technique training" },
      { p: "Qual foi o placar da maior goleada em Copas do Mundo?", v: "10 a 1 (Hungria x El Salvador, 1982)", f: ["9 a 0", "8 a 0", "7 a 1"], img: "World Cup historical scoreboard match" },
      { p: "Qual nadador brasileiro ganhou ouro nos 50m livre?", v: "César Cielo", f: ["Gustavo Borges", "Fernando Scherer", "Bruno Fratus"], img: "swimming gold medal 50m freestyle" },
      { p: "Qual é o recorde de gols em uma única temporada europeia?", v: "73 gols (Messi, 2011-12)", f: ["60 gols", "69 gols", "80 gols"], img: "soccer player scoring goal celebration" },
      { p: "Qual esporte de inverno combina esqui e tiro?", v: "Biatlo", f: ["Pentatlo", "Esqui Cross-Country", "Combinado Nórdico"], img: "biathlon skiing and shooting winter sport" },
      { p: "Qual time de basquete tem mais títulos da NBA?", v: "Boston Celtics", f: ["LA Lakers", "Chicago Bulls", "Golden State Warriors"], img: "NBA championship trophy basketball court" },
      { p: "Qual circuito de F1 é conhecido como 'Templo da Velocidade'?", v: "Monza (Itália)", f: ["Spa (Bélgica)", "Silverstone (UK)", "Interlagos (Brasil)"], img: "Monza F1 circuit high speed straight" },
      { p: "Qual boxeador foi apelidado de 'The Greatest'?", v: "Muhammad Ali", f: ["Mike Tyson", "Floyd Mayweather", "Sugar Ray Leonard"], img: "boxing gloves and championship belt" },
      { p: "Em qual ano o Brasil perdeu de 7x1 para a Alemanha?", v: "2014", f: ["2010", "2018", "2006"], img: "Brazil vs Germany World Cup 2014 stadium" },
      { p: "Qual é o recorde mundial do salto em altura?", v: "2,45m (Javier Sotomayor)", f: ["2,50m", "2,40m", "2,38m"], img: "high jump bar athletic competition" },
      { p: "Qual tenista tem mais Grand Slams masculinos?", v: "Novak Djokovic", f: ["Roger Federer", "Rafael Nadal", "Pete Sampras"], img: "tennis Grand Slam trophy court" },
      { p: "Qual seleção nunca perdeu uma final de Copa do Mundo?", v: "Nenhuma (todas já perderam)", f: ["Brasil", "Alemanha", "Argentina"], img: "World Cup final match dramatic moment" },
      { p: "Qual foi o primeiro esporte incluído nas Olimpíadas?", v: "Corrida (stadion)", f: ["Luta", "Lançamento de disco", "Boxe"], img: "ancient Greek Olympics running competition" }
    ],
    infernal: [
      { p: "Qual é a velocidade máxima de uma bola de saque no tênis?", v: "~263 km/h (Sam Groth)", f: ["~250 km/h", "~230 km/h", "~280 km/h"], img: "tennis serve high speed motion blur" },
      { p: "Qual jogador marcou o 'Gol do Século' na Copa de 1986?", v: "Maradona", f: ["Pelé", "Zidane", "Romário"], img: "legendary soccer dribble goal celebration" },
      { p: "Qual é o único time que participou de todas as Copas do Mundo?", v: "Brasil", f: ["Alemanha", "Itália", "Argentina"], img: "Brazil national team historical all World Cups" },
      { p: "Qual corrida de cavalos mais famosa acontece em Churchill Downs?", v: "Kentucky Derby", f: ["Preakness Stakes", "Belmont Stakes", "Royal Ascot"], img: "horse racing Churchill Downs Kentucky Derby" },
      { p: "Qual atleta olímpico ganhou 9 ouros no atletismo?", v: "Carl Lewis", f: ["Jesse Owens", "Usain Bolt", "Paavo Nurmi"], img: "track and field Olympic gold medals" },
      { p: "Qual é o nome da competição de ciclismo mais difícil do mundo?", v: "Tour de France", f: ["Giro d'Italia", "Vuelta a España", "Paris-Roubaix"], img: "Tour de France cyclists mountain stage" },
      { p: "Qual foi o maior público registrado numa partida de futebol?", v: "~200.000 (Maracanã, 1950)", f: ["~150.000", "~180.000", "~120.000"], img: "packed Maracana stadium 1950 World Cup" },
      { p: "Qual é o nome do sistema de pontuação do tênis?", v: "15-30-40-Game", f: ["1-2-3-Set", "10-20-30-Game", "5-10-15-Game"], img: "tennis scoreboard traditional scoring system" },
      { p: "Qual ginasta é a mais condecorada em Mundiais?", v: "Simone Biles", f: ["Nadia Comaneci", "Larisa Latynina", "Gabby Douglas"], img: "gymnastics floor routine powerful performance" },
      { p: "Qual é o peso de uma bola de boliche profissional máxima?", v: "16 libras (~7,26 kg)", f: ["14 libras", "18 libras", "20 libras"], img: "bowling ball heavy professional lane" },
      { p: "Qual clube de futebol tem o apelido 'Merengues'?", v: "Real Madrid", f: ["Barcelona", "Atlético Madrid", "Juventus"], img: "Real Madrid white jersey stadium" },
      { p: "Qual é o recorde de cestas de 3 pontos em um jogo da NBA?", v: "14 cestas (Klay Thompson)", f: ["12 cestas", "15 cestas", "11 cestas"], img: "basketball three point shot splash" },
      { p: "Qual é a velocidade máxima atingida na Fórmula 1?", v: "~372 km/h", f: ["~350 km/h", "~400 km/h", "~330 km/h"], img: "F1 car speed record straight line" },
      { p: "Qual país dominou o wrestling olímpico historicamente?", v: "Rússia/URSS", f: ["EUA", "Turquia", "Irã"], img: "Olympic wrestling match intense competition" },
      { p: "Qual é o nome da formação 'catenaccio' no futebol?", v: "Sistema defensivo italiano com líbero", f: ["Ataque total holandês", "Tiki-taka espanhol", "Pressing alemão"], img: "Italian football tactical formation catenaccio" }
    ]
  },

  // ============================
  // 🎵 MÚSICA
  // ============================
  musica: {
    facil: [
      { p: "Qual instrumento tem teclas brancas e pretas?", v: "Piano", f: ["Guitarra", "Violão", "Flauta"], img: "piano keyboard black and white keys" },
      { p: "Quantas cordas tem um violão tradicional?", v: "6 cordas", f: ["4 cordas", "5 cordas", "8 cordas"], img: "acoustic guitar six strings close-up" },
      { p: "Qual gênero musical nasceu nos EUA com influência africana?", v: "Jazz", f: ["Rock", "Samba", "Reggae"], img: "jazz musicians saxophone trumpet club" },
      { p: "Qual instrumento o baterista toca?", v: "Bateria", f: ["Baixo", "Guitarra", "Teclado"], img: "drum kit on stage with cymbals" },
      { p: "Qual banda cantou 'Bohemian Rhapsody'?", v: "Queen", f: ["The Beatles", "Led Zeppelin", "Pink Floyd"], img: "rock band on stage concert dramatic lighting" },
      { p: "Qual ritmo brasileiro surgiu no Rio de Janeiro?", v: "Samba", f: ["Forró", "Frevo", "Maracatu"], img: "samba carnival Rio de Janeiro drums" },
      { p: "Qual nota musical vem depois de 'Dó'?", v: "Ré", f: ["Mi", "Fá", "Sol"], img: "musical notes on sheet music staff" },
      { p: "Qual instrumento de sopro é dourado e curvado?", v: "Saxofone", f: ["Trompete", "Trombone", "Clarinete"], img: "golden saxophone dramatic lighting" },
      { p: "Qual é o ritmo musical mais popular da Jamaica?", v: "Reggae", f: ["Dancehall", "Ska", "Calypso"], img: "Jamaican reggae music colorful vibes" },
      { p: "Quem é a 'Rainha do Pop'?", v: "Madonna", f: ["Beyoncé", "Lady Gaga", "Rihanna"], img: "pop music stage concert diva performance" },
      { p: "Qual instrumento de sopro de madeira tem uma palheta?", v: "Clarinete", f: ["Flauta", "Oboé", "Trompete"], img: "clarinet woodwind instrument close-up" },
      { p: "Qual gênero musical é característico do Nordeste brasileiro?", v: "Forró", f: ["Funk", "MPB", "Bossa Nova"], img: "accordion and triangle forro instruments" },
      { p: "Qual símbolo musical indica silêncio?", v: "Pausa", f: ["Sustenido", "Bemol", "Clave"], img: "music rest pause symbol on sheet" },
      { p: "Qual instrumento indiano tem muitas cordas e é tocado sentado?", v: "Sitar", f: ["Tabla", "Tambura", "Sarangi"], img: "Indian sitar stringed instrument ornate" },
      { p: "Qual cantor é conhecido como 'Rei do Rock'?", v: "Elvis Presley", f: ["Chuck Berry", "Little Richard", "Jerry Lee Lewis"], img: "vintage rock and roll guitar microphone" }
    ],
    medio: [
      { p: "Qual compositor ficou surdo e continuou compondo?", v: "Beethoven", f: ["Mozart", "Bach", "Chopin"], img: "classical music piano concert hall grand" },
      { p: "Qual instrumento brasileiro é essencial no samba?", v: "Pandeiro", f: ["Berimbau", "Cuíca", "Tamborim"], img: "Brazilian pandeiro tambourine samba instrument" },
      { p: "Qual é o nome do intervalo de oito notas na música?", v: "Oitava", f: ["Quinta", "Terça", "Sétima"], img: "piano octave eight notes keyboard" },
      { p: "Qual banda britânica gravou 'Stairway to Heaven'?", v: "Led Zeppelin", f: ["The Rolling Stones", "The Who", "Deep Purple"], img: "classic rock band legendary guitar solo" },
      { p: "Qual é o tom mais grave de voz humana?", v: "Baixo", f: ["Barítono", "Tenor", "Contralto"], img: "opera bass singer dramatic stage" },
      { p: "Qual gênero brasileiro mistura samba com jazz?", v: "Bossa Nova", f: ["MPB", "Chorinho", "Tropicália"], img: "bossa nova guitar beach Rio style" },
      { p: "Qual compositor escreveu 'As Quatro Estações'?", v: "Vivaldi", f: ["Bach", "Handel", "Haydn"], img: "Vivaldi Four Seasons orchestra performance" },
      { p: "Quantas notas tem uma escala cromática?", v: "12 notas", f: ["7 notas", "8 notas", "10 notas"], img: "chromatic scale piano keys highlighted" },
      { p: "Qual instrumento de percussão africano tem formato de taça?", v: "Djembê", f: ["Conga", "Bongô", "Cajón"], img: "djembe African drum hand percussion" },
      { p: "Qual era o nome artístico de Stefani Germanotta?", v: "Lady Gaga", f: ["Adele", "Lana Del Rey", "Sia"], img: "pop star dramatic stage costume performance" },
      { p: "Qual é o instrumento principal do chorinho?", v: "Flauta", f: ["Violão", "Cavaquinho", "Bandolim"], img: "Brazilian choro flute mandolin music" },
      { p: "Qual banda lançou o álbum 'The Dark Side of the Moon'?", v: "Pink Floyd", f: ["Genesis", "Yes", "King Crimson"], img: "prism rainbow light dark side album art" },
      { p: "Qual cantor brasileiro ficou conhecido como 'Rei da Voz'?", v: "Francisco Alves", f: ["Orlando Silva", "Mário Reis", "Vicente Celestino"], img: "vintage Brazilian radio singer microphone" },
      { p: "O que é um 'riff' na música?", v: "Trecho melódico repetido", f: ["Solo de bateria", "Mudança de tom", "Final da música"], img: "electric guitar riff rock music" },
      { p: "Qual estilo de música eletrônica tem ~128 BPM?", v: "House", f: ["Drum and Bass", "Dubstep", "Techno"], img: "DJ mixing house music turntable neon" }
    ],
    dificil: [
      { p: "Qual é a afinação padrão internacional em Hz?", v: "440 Hz (Lá)", f: ["432 Hz", "450 Hz", "420 Hz"], img: "tuning fork A440 frequency vibration" },
      { p: "Qual modo grego é usado no jazz para improvisar sobre dominantes?", v: "Mixolídio", f: ["Dórico", "Frígio", "Lídio"], img: "jazz improvisation musical scales modes" },
      { p: "Qual compositor barroco escreveu o 'Cravo Bem Temperado'?", v: "J.S. Bach", f: ["Handel", "Vivaldi", "Scarlatti"], img: "harpsichord well-tempered keyboard baroque" },
      { p: "Qual instrumento inventado por Adolphe Sax?", v: "Saxofone", f: ["Clarinete", "Oboé", "Tuba"], img: "saxophone inventor Adolphe Sax golden brass" },
      { p: "Qual é o compasso mais comum na música ocidental?", v: "4/4 (Quaternário)", f: ["3/4", "6/8", "2/2"], img: "time signature 4/4 sheet music notation" },
      { p: "Qual banda pioneou o heavy metal britânico?", v: "Black Sabbath", f: ["Led Zeppelin", "Deep Purple", "Judas Priest"], img: "heavy metal dark concert stage fire" },
      { p: "Qual técnica vocal usa 'falsete'?", v: "Voz de cabeça aguda", f: ["Vibrato", "Belting", "Growl"], img: "singer high note falsetto vocal performance" },
      { p: "Qual movimento musical brasileiro surgiu nos anos 60?", v: "Tropicália", f: ["Jovem Guarda", "Bossa Nova", "Manguebeat"], img: "Tropicalia Brazilian music 1960s colorful" },
      { p: "Qual é o nome de um grupo de 4 músicos clássicos?", v: "Quarteto", f: ["Trio", "Quinteto", "Sexteto"], img: "string quartet classical music performance" },
      { p: "Qual sintetizador revolucionou a música eletrônica nos anos 60?", v: "Moog", f: ["Roland", "Korg", "Yamaha"], img: "Moog synthesizer vintage analog modular" },
      { p: "Qual artista brasileiro gravou 'Construção'?", v: "Chico Buarque", f: ["Caetano Veloso", "Gilberto Gil", "Tom Jobim"], img: "Brazilian MPB singer-songwriter vinyl record" },
      { p: "Qual escala é usada no blues?", v: "Escala pentatônica menor", f: ["Escala maior", "Escala cromática", "Escala harmônica menor"], img: "blues guitar scale notes on fretboard" },
      { p: "Qual técnica de guitarra usa 'hammer-on' e 'pull-off'?", v: "Legato", f: ["Tapping", "Sweep picking", "Palm mute"], img: "guitar fretboard legato technique hands" },
      { p: "Qual compositor escreveu 'O Lago dos Cisnes'?", v: "Tchaikovsky", f: ["Prokofiev", "Stravinsky", "Rachmaninoff"], img: "Swan Lake ballet stage performance" },
      { p: "O que é polirritmia?", v: "Dois ou mais ritmos simultâneos", f: ["Ritmo em 3/4", "Mudança de andamento", "Solo de percussão"], img: "polyrhythm multiple percussion patterns" }
    ],
    infernal: [
      { p: "Qual é a frequência exata da nota Dó central (C4)?", v: "~261,63 Hz", f: ["~256 Hz", "~270 Hz", "~250 Hz"], img: "middle C piano key frequency wave" },
      { p: "Qual sistema de afinação divide a oitava em partes iguais?", v: "Temperamento igual", f: ["Afinação pitagórica", "Afinação justa", "Temperamento mesotônico"], img: "equal temperament tuning system diagram" },
      { p: "Qual compositor inventou a técnica de 12 tons (dodecafonismo)?", v: "Arnold Schoenberg", f: ["Igor Stravinsky", "Béla Bartók", "Alban Berg"], img: "twelve-tone row atonal music composition" },
      { p: "Qual é o nome do efeito de repetição rápida de uma nota?", v: "Tremolo", f: ["Vibrato", "Trilo", "Portamento"], img: "tremolo effect guitar pedal vibration" },
      { p: "Qual instrumento de cordas tem a afinação CGDA?", v: "Viola de arco", f: ["Violino", "Violoncelo", "Contrabaixo"], img: "viola orchestral string instrument" },
      { p: "Qual obra de John Cage consiste em 4'33\" de silêncio?", v: "4'33\"", f: ["Music of Changes", "Sonatas and Interludes", "Imaginary Landscape"], img: "empty concert stage piano silent performance" },
      { p: "Qual intervalo musical é chamado de 'diabolus in musica'?", v: "Trítono", f: ["Sétima menor", "Segunda menor", "Nona"], img: "tritone interval dark musical notation" },
      { p: "Qual é o BPM típico do Drum and Bass?", v: "~170-180 BPM", f: ["~130-140 BPM", "~200-210 BPM", "~100-110 BPM"], img: "drum and bass DJ fast electronic music" },
      { p: "Qual maestro ficou famoso regendo a Filarmônica de Berlim por 35 anos?", v: "Herbert von Karajan", f: ["Leonard Bernstein", "Arturo Toscanini", "Claudio Abbado"], img: "Berlin Philharmonic conductor orchestra" },
      { p: "Qual fenômeno acústico ocorre quando duas frequências próximas interferem?", v: "Batimento", f: ["Ressonância", "Difração", "Reverberação"], img: "acoustic wave interference beating phenomenon" },
      { p: "Qual cantor de ópera italiano é considerado o maior tenor?", v: "Luciano Pavarotti", f: ["Plácido Domingo", "José Carreras", "Enrico Caruso"], img: "opera tenor singer grand performance" },
      { p: "Qual guitarra é mais associada ao jazz?", v: "Gibson ES-335 / archtop", f: ["Fender Stratocaster", "Gibson Les Paul", "Fender Telecaster"], img: "archtop jazz guitar hollow body vintage" },
      { p: "Qual notação musical usa números em vez de pautas?", v: "Tablatura", f: ["Cifra", "Partitura", "Lead sheet"], img: "guitar tablature TAB notation strings" },
      { p: "Qual é a tonalidade com mais sustenidos (7)?", v: "Dó# maior / Lá# menor", f: ["Fá# maior", "Si maior", "Mi maior"], img: "key signature seven sharps sheet music" },
      { p: "Qual álbum dos Beatles é considerado o primeiro conceitual?", v: "Sgt. Pepper's Lonely Hearts Club Band", f: ["Abbey Road", "Revolver", "The White Album"], img: "colorful conceptual album cover retro style" }
    ]
  },

  // ============================
  // 🎬 FILMES E SÉRIES
  // ============================
  filmes: {
    facil: [
      { p: "Qual personagem da Disney é uma princesa de gelo?", v: "Elsa (Frozen)", f: ["Anna", "Rapunzel", "Moana"], img: "ice castle frozen magical winter scene" },
      { p: "Qual é o nome do rato chef do filme da Pixar?", v: "Remy (Ratatouille)", f: ["Stuart", "Mickey", "Jerry"], img: "animated rat cooking in French kitchen" },
      { p: "Qual filme tem um tubarão aterrorizando uma praia?", v: "Tubarão (Jaws)", f: ["Piranha", "Mar Aberto", "Meg"], img: "great white shark approaching swimmer" },
      { p: "Qual super-herói é de Wakanda?", v: "Pantera Negra", f: ["Homem de Ferro", "Thor", "Capitão América"], img: "futuristic African kingdom vibranium technology" },
      { p: "Qual filme de animação tem brinquedos que ganham vida?", v: "Toy Story", f: ["Carros", "Monstros S.A.", "Procurando Nemo"], img: "cowboy and spaceman toy animated movie" },
      { p: "Qual vilão usa uma máscara preta e respira alto?", v: "Darth Vader", f: ["Bane", "Predador", "Kylo Ren"], img: "dark villain black mask breathing heavy" },
      { p: "Qual filme tem dinossauros em um parque?", v: "Jurassic Park", f: ["King Kong", "Godzilla", "Avatar"], img: "dinosaurs in a tropical theme park" },
      { p: "Qual é o nome do peixe-palhaço do Nemo?", v: "Nemo", f: ["Marlin", "Dory", "Gil"], img: "clownfish in colorful coral reef" },
      { p: "Qual série tem dragões e tronos?", v: "Game of Thrones", f: ["Vikings", "The Witcher", "Senhor dos Anéis"], img: "dragons flying over medieval castle" },
      { p: "Qual filme tem um navio que afunda após bater num iceberg?", v: "Titanic", f: ["Poseidon", "A Vida de Pi", "Master and Commander"], img: "luxury ocean liner ship hitting iceberg" },
      { p: "Quem interpreta Jack Sparrow?", v: "Johnny Depp", f: ["Orlando Bloom", "Brad Pitt", "Leonardo DiCaprio"], img: "pirate captain ship Caribbean adventure" },
      { p: "Qual série tem um laboratório de química no deserto?", v: "Breaking Bad", f: ["Better Call Saul", "Narcos", "Dexter"], img: "chemistry lab in desert dramatic scene" },
      { p: "Qual franquia tem lightsabers?", v: "Star Wars", f: ["Star Trek", "Duna", "Guardiões da Galáxia"], img: "glowing lightsaber blue in dark room" },
      { p: "Qual filme tem a frase 'Houston, temos um problema'?", v: "Apollo 13", f: ["Gravidade", "O Marciano", "Interestelar"], img: "space capsule Apollo mission control" },
      { p: "Qual personagem é um ogro verde que vive num pântano?", v: "Shrek", f: ["Fiona", "Burro", "Gato de Botas"], img: "green ogre swamp cottage fairy tale" }
    ],
    medio: [
      { p: "Qual diretor é conhecido por filmes como 'Inception' e 'Tenet'?", v: "Christopher Nolan", f: ["Steven Spielberg", "James Cameron", "Denis Villeneuve"], img: "complex cinematic cityscape inception style" },
      { p: "Qual ator interpretou o Coringa em 'O Cavaleiro das Trevas'?", v: "Heath Ledger", f: ["Joaquin Phoenix", "Jack Nicholson", "Jared Leto"], img: "dark knight villain chaos anarchy" },
      { p: "Em qual filme Neo descobre que vive numa simulação?", v: "Matrix", f: ["Blade Runner", "Tron", "Ready Player One"], img: "green digital rain code falling screen" },
      { p: "Qual série coreana sobre jogos infantis mortais viralizou?", v: "Round 6 (Squid Game)", f: ["Alice in Borderland", "Sweet Home", "All of Us Are Dead"], img: "giant doll red light green light game" },
      { p: "Quem dirigiu 'Pulp Fiction'?", v: "Quentin Tarantino", f: ["Martin Scorsese", "Coen Brothers", "David Fincher"], img: "retro diner noir crime movie scene" },
      { p: "Qual filme ganhou o Oscar de Melhor Filme em 2020?", v: "Parasita", f: ["1917", "Coringa", "Era Uma Vez em... Hollywood"], img: "luxury house and basement contrast movie" },
      { p: "Qual ator interpreta Wolverine nos filmes X-Men?", v: "Hugh Jackman", f: ["Ryan Reynolds", "Chris Hemsworth", "Robert Downey Jr"], img: "adamantium claws wild berserker rage" },
      { p: "Qual série mostra a vida na prisão de Litchfield?", v: "Orange is the New Black", f: ["Prison Break", "Oz", "Wentworth"], img: "prison orange jumpsuit corridor drama" },
      { p: "Qual é o nome do hobbit que carrega o Anel?", v: "Frodo Baggins", f: ["Bilbo Baggins", "Samwise Gamgee", "Merry Brandybuck"], img: "golden ring on a fantasy adventure map" },
      { p: "Qual estúdio de animação criou 'A Viagem de Chihiro'?", v: "Studio Ghibli", f: ["Pixar", "DreamWorks", "Toei Animation"], img: "magical Japanese bathhouse spirit world" },
      { p: "Qual filme de terror tem um palhaço chamado Pennywise?", v: "It (A Coisa)", f: ["Jogos Mortais", "O Exorcista", "Invocação do Mal"], img: "creepy clown red balloon sewer drain" },
      { p: "Qual ator interpretou Tony Montana em Scarface?", v: "Al Pacino", f: ["Robert De Niro", "Joe Pesci", "Ray Liotta"], img: "crime boss desk money power 1980s" },
      { p: "Em qual universo acontece 'Duna'?", v: "Universo de Frank Herbert", f: ["Universo Star Wars", "Universo Marvel", "Universo Alien"], img: "desert planet sandworm giant dunes sci-fi" },
      { p: "Qual série de TV tem a famosa 'Red Wedding'?", v: "Game of Thrones", f: ["Vikings", "The Witcher", "Rome"], img: "medieval feast banquet tragic red scene" },
      { p: "Qual filme mostrou a história de Alan Turing quebrando Enigma?", v: "O Jogo da Imitação", f: ["Uma Mente Brilhante", "Oppenheimer", "Ex Machina"], img: "Enigma machine WWII codebreaking" }
    ],
    dificil: [
      { p: "Qual filme de Kubrick se passa em um hotel assombrado?", v: "O Iluminado (The Shining)", f: ["De Olhos Bem Fechados", "Laranja Mecânica", "2001"], img: "haunted hotel long corridor twins horror" },
      { p: "Qual foi o primeiro filme a arrecadar 1 bilhão de dólares?", v: "Titanic (1997)", f: ["Star Wars (1977)", "Jurassic Park (1993)", "Avatar (2009)"], img: "movie box office billion dollars cinema" },
      { p: "Qual ator japonês é ícone dos filmes de Akira Kurosawa?", v: "Toshiro Mifune", f: ["Ken Watanabe", "Takeshi Kitano", "Tatsuya Nakadai"], img: "samurai Japanese classic cinema black white" },
      { p: "Qual diretor mexicano ganhou 3 Oscars de Melhor Diretor?", v: "Nenhum (cada um ganhou 2)", f: ["Alfonso Cuarón", "Alejandro Iñárritu", "Guillermo del Toro"], img: "Oscar statue golden Academy Award" },
      { p: "Qual é o filme mais longo da série O Senhor dos Anéis (versão estendida)?", v: "O Retorno do Rei (~263 min)", f: ["As Duas Torres", "A Sociedade do Anel", "O Hobbit"], img: "epic fantasy battle field army castle" },
      { p: "Qual ator interpretou o Doutor Estranho na Marvel?", v: "Benedict Cumberbatch", f: ["Tom Hiddleston", "Robert Downey Jr", "Chris Evans"], img: "mystical sorcerer portal magic multiverse" },
      { p: "Qual anime de 1988 inspirou a estética cyberpunk?", v: "Akira", f: ["Ghost in the Shell", "Cowboy Bebop", "Neon Genesis Evangelion"], img: "cyberpunk futuristic motorcycle neon city" },
      { p: "Qual atriz ganhou mais Oscars de Melhor Atriz?", v: "Katharine Hepburn (4 Oscars)", f: ["Meryl Streep", "Ingrid Bergman", "Cate Blanchett"], img: "vintage Hollywood golden age actress portrait" },
      { p: "Qual filme do Studio Ghibli envolve um castelo que anda?", v: "O Castelo Animado", f: ["Ponyo", "Meu Vizinho Totoro", "Princesa Mononoke"], img: "walking steampunk castle fantasy landscape" },
      { p: "Qual foi o primeiro filme com som sincronizado?", v: "O Cantor de Jazz (1927)", f: ["Metrópolis", "Nosferatu", "O Garoto"], img: "1920s cinema first talkie sound movie" },
      { p: "Qual série da HBO mostra a construção de Westworld?", v: "Westworld", f: ["Altered Carbon", "Devs", "Humans"], img: "android robot theme park western setting" },
      { p: "Qual filme distópico foi baseado no livro de George Orwell?", v: "1984", f: ["Admirável Mundo Novo", "Fahrenheit 451", "Blade Runner"], img: "dystopian surveillance Big Brother society" },
      { p: "Qual diretor criou 'Psicose' e é mestre do suspense?", v: "Alfred Hitchcock", f: ["David Lynch", "Roman Polanski", "Brian De Palma"], img: "suspense noir shower scene silhouette" },
      { p: "Qual série da Apple TV+ mostra cientistas em um bunker?", v: "Silo", f: ["Foundation", "Severance", "Dark Matter"], img: "underground silo bunker post-apocalyptic" },
      { p: "Qual CGI revolucionário foi usado em Jurassic Park (1993)?", v: "Primeiros dinossauros em CGI realista", f: ["Motion capture", "Ray tracing", "Bullet time"], img: "CGI dinosaur revolution movie effects" }
    ],
    infernal: [
      { p: "Qual técnica de câmera Hitchcock inventou em 'Vertigo'?", v: "Dolly zoom (efeito Vertigo)", f: ["Plano-sequência", "Câmera subjetiva", "Jump cut"], img: "Vertigo dolly zoom spiral staircase effect" },
      { p: "Qual foi o primeiro filme de animação longa-metragem?", v: "El Apóstol (1917)", f: ["Branca de Neve (1937)", "Fantasia (1940)", "Bambi (1942)"], img: "very early animation film vintage silent era" },
      { p: "Qual efeito especial do Matrix revolucionou o cinema?", v: "Bullet Time", f: ["Wire-fu", "Morphing", "Chroma key"], img: "slow motion bullet dodging camera rotation" },
      { p: "Qual filme tem o maior número de Oscars (11)?", v: "Titanic/Ben-Hur/LOTR:ROTK (11 cada)", f: ["Schindler's List", "Forrest Gump", "Gladiator"], img: "multiple Oscar golden statues awards" },
      { p: "Qual é o nome do MacGuffin mais famoso de Hitchcock?", v: "Não importa (é o conceito em si)", f: ["O maleta", "O anel", "O documento"], img: "mysterious briefcase spotlight film noir" },
      { p: "Qual ator recusou o Oscar de Melhor Ator em 1973?", v: "Marlon Brando", f: ["Al Pacino", "Jack Nicholson", "Dustin Hoffman"], img: "1970s Oscar ceremony vintage Hollywood" },
      { p: "Qual filme independente de 1999 custou US$60.000 e faturou US$248 milhões?", v: "A Bruxa de Blair", f: ["Paranormal Activity", "Clerks", "El Mariachi"], img: "found footage horror forest night camera" },
      { p: "Qual filme de Tarkovsky é considerado o maior sci-fi artístico?", v: "Stalker (1979)", f: ["Solaris", "O Espelho", "Nostalgia"], img: "desolate zone mysterious landscape art film" },
      { p: "Qual longa de David Lynch é um pesadelo noir em Hollywood?", v: "Mulholland Drive", f: ["Blue Velvet", "Lost Highway", "Inland Empire"], img: "surreal Hollywood night drive dreamscape" },
      { p: "Qual foi o primeiro filme a usar chroma key (tela verde)?", v: "O Ladrão de Bagdá (1940)", f: ["Ben-Hur (1959)", "Jason e os Argonautas", "Mary Poppins"], img: "vintage movie green screen special effects" },
      { p: "Qual filme experimental de Andy Warhol dura 5 horas e 20 minutos?", v: "Sleep (1964)", f: ["Empire", "Chelsea Girls", "Lonesome Cowboys"], img: "experimental art film minimalist abstract" },
      { p: "Qual é o plano-sequência mais longo já filmado num longa?", v: "Russian Ark (96 min, filme inteiro)", f: ["Birdman", "1917", "Rope"], img: "continuous shot museum grand art gallery" },
      { p: "Qual é o nome da técnica japonesa 'ma' usada por Ozu?", v: "Espaço vazio / pausa contemplativa", f: ["Câmera baixa", "Jump cut", "Slow motion"], img: "contemplative empty room Japanese cinema" },
      { p: "Qual filme de Terrence Malick narra a criação do universo?", v: "A Árvore da Vida", f: ["Além da Linha Vermelha", "Knight of Cups", "Badlands"], img: "cosmic creation universe life evolution" },
      { p: "Qual é a duração do corte mais longo de 'Once Upon a Time in America'?", v: "~269 minutos (4h29)", f: ["~180 minutos", "~220 minutos", "~300 minutos"], img: "gangster noir New York vintage film" }
    ]
  }
};

try {
  const { BANCO_EXTRA } = require('./quizbank_extra');
  for (const tema of Object.keys(BANCO_EXTRA)) {
    if (BANCO_PERGUNTAS[tema]) {
      for (const diff of Object.keys(BANCO_EXTRA[tema])) {
        if (BANCO_PERGUNTAS[tema][diff]) {
          BANCO_PERGUNTAS[tema][diff].push(...BANCO_EXTRA[tema][diff]);
        }
      }
    }
  }
  console.log("✅ Banco de perguntas estendido carregado com sucesso (+420).");
} catch (e) {
  console.error("⚠️ Erro ao carregar o banco extra de perguntas:", e);
}

// Histórico de perguntas usadas para evitar repetição
const perguntasUsadas = new Map(); // "channelId:tema:dificuldade" => Set de índices

function getPerguntaAleatoria(channelId, temaKey, diffKey) {
  const perguntas = BANCO_PERGUNTAS[temaKey]?.[diffKey];
  if (!perguntas || perguntas.length === 0) return null;

  const key = `${channelId}:${temaKey}:${diffKey}`;
  if (!perguntasUsadas.has(key)) {
    perguntasUsadas.set(key, []);
  }

  const historico = perguntasUsadas.get(key);
  let disponiveis = perguntas.map((_, i) => i).filter(i => !historico.includes(i));

  // Se todas foram usadas, reseta mantendo as últimas 3
  if (disponiveis.length === 0) {
    const ultimas3 = historico.slice(-3);
    perguntasUsadas.set(key, ultimas3);
    disponiveis = perguntas.map((_, i) => i).filter(i => !ultimas3.includes(i));
  }

  const idx = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  historico.push(idx);
  if (historico.length > 30) historico.shift();

  return perguntas[idx];
}

module.exports = { BANCO_PERGUNTAS, getPerguntaAleatoria };
