const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const config = require("./config");
const { assertForgeReady } = require("./services");
const { addCoins, removeCoins } = require("./economy");
const { getGameMultiplier } = require("./boosts");

const forcaGames = new Map();

// ========== TEMAS E BANCO DE PALAVRAS DIVERSIFICADO ==========

const TEMAS = {
  animais: {
    emoji: "🐾",
    label: "Animais",
    palavras: [
      "CACHORRO", "GATO", "ELEFANTE", "GIRAFA", "RINOCERONTE",
      "HIPOPOTAMO", "CROCODILO", "TARTARUGA", "BORBOLETA", "ESCORPIAO",
      "PAPAGAIO", "TUBARAO", "GOLFINHO", "PINGUIM", "FLAMINGO",
      "CAMALEAO", "ORNITORRINCO", "CAPIVARA", "TAMANDUÁ", "PREGUICA",
      "GUEPARDO", "LEOPARDO", "PANTERA", "AVESTRUZ", "PELICANO",
      "SALAMANDRA", "IGUANA", "MORCEGO", "OURICO", "CORUJA",
      "POLVO", "LULA", "CARANGUEJO", "LAGOSTA", "CAVALO",
      "ARANHA", "FORMIGA", "JOANINHA", "GRILO", "LOUVA-DEUS"
    ]
  },
  comida: {
    emoji: "🍕",
    label: "Comida & Bebida",
    palavras: [
      "HAMBURGUER", "PIZZA", "LASANHA", "BRIGADEIRO", "PAMONHA",
      "FEIJOADA", "COXINHA", "PASTEL", "TAPIOCA", "ACAI",
      "CHURRASCO", "STROGANOFF", "MACARRAO", "CARBONARA", "RISOTO",
      "CROISSANT", "CAPPUCCINO", "MILKSHAKE", "VITAMINA", "LIMONADA",
      "PUDIM", "CHURROS", "EMPANADA", "SASHIMI", "TEMAKI",
      "GUACAMOLE", "NACHOS", "BRUSCHETTA", "RAVIOLI", "TIRAMISU",
      "PANQUECA", "WAFFLE", "GRANOLA", "IOGURTE", "MOZZARELLA",
      "ESPAGUETE", "SORVETE", "CHOCOLATE", "CARAMELO", "AMENDOIM"
    ]
  },
  tecnologia: {
    emoji: "💻",
    label: "Tecnologia",
    palavras: [
      "COMPUTADOR", "TELEFONE", "INTERNET", "ALGORITMO", "BLUETOOTH",
      "PROCESSADOR", "TECLADO", "MONITOR", "IMPRESSORA", "PENDRIVE",
      "SERVIDOR", "FIREWALL", "ROTEADOR", "SATELITE", "HOLOGRAFIA",
      "CRIPTOGRAFIA", "INTELIGENCIA", "ROBOTICA", "HOLOGRAMA", "PROGRAMA",
      "NOTEBOOK", "TABLET", "FONE", "MICROFONE", "WEBCAM",
      "APLICATIVO", "SOFTWARE", "HARDWARE", "DOWNLOAD", "STREAMING",
      "PIXEL", "MEGABYTE", "GIGABYTE", "TERABYTE", "BINARIO",
      "CIRCUITO", "TRANSISTOR", "SIMULACAO", "REALIDADE", "VIRTUAL"
    ]
  },
  esportes: {
    emoji: "⚽",
    label: "Esportes",
    palavras: [
      "FUTEBOL", "BASQUETE", "VOLEIBOL", "NATACAO", "ATLETISMO",
      "CICLISMO", "ESGRIMA", "BOXE", "KARATE", "SURFE",
      "SKATE", "GINASTICA", "HANDEBOL", "TENIS", "GOLFE",
      "BADMINTON", "POLO", "CANOAGEM", "REMO", "MERGULHO",
      "ESCALADA", "MARATONA", "PENTATLO", "TRIATHLON", "HOQUEI",
      "RUGBY", "BEISEBOL", "CRICKET", "CORRIDA", "ARREMESSO",
      "TRAMPOLIM", "SALTO", "LUTA", "LEVANTAMENTO", "TREINADOR",
      "CAMPEONATO", "OLIMPIADA", "MEDALHA", "PODIO", "ARBITRO"
    ]
  },
  profissoes: {
    emoji: "👨‍🔬",
    label: "Profissões",
    palavras: [
      "ASTRONAUTA", "ENGENHEIRO", "PROFESSOR", "BOMBEIRO", "MEDICO",
      "DENTISTA", "VETERINARIO", "ADVOGADO", "ARQUITETO", "COZINHEIRO",
      "PILOTO", "MECANICO", "ELETRICISTA", "ENFERMEIRO", "FARMACEUTICO",
      "PSICÓLOGO", "JORNALISTA", "FOTOGRAFO", "PROGRAMADOR", "DESIGNER",
      "AGRICULTOR", "PESCADOR", "PEDREIRO", "MARCENEIRO", "PADEIRO",
      "AÇOUGUEIRO", "CARTEIRO", "MOTORISTA", "DETETIVE", "DELEGADO",
      "CIENTISTA", "BIOLOGO", "QUIMICO", "FISICO", "GEÓLOGO",
      "ASTRONOMO", "ECONOMISTA", "CONTADOR", "BIBLIOTECARIO", "TRADUTOR"
    ]
  },
  paises: {
    emoji: "🌍",
    label: "Países & Cidades",
    palavras: [
      "ARGENTINA", "AUSTRALIA", "ALEMANHA", "BANGLADESH", "COLOMBIA",
      "DINAMARCA", "EQUADOR", "FINLANDIA", "GUATEMALA", "HOLANDA",
      "INDONESIA", "JAPAO", "MADAGASCAR", "NORUEGA", "PARAGUAI",
      "SINGAPURA", "TAILANDIA", "URUGUAI", "VENEZUELA", "ZIMBABUE",
      "ISTAMBUL", "TOQUIO", "BARCELONA", "AMSTERDAM", "ESTOCOLMO",
      "MARROCOS", "MONGOLIA", "CAZAQUISTAO", "ESLOVAQUIA", "ROMENIA",
      "ISLANDIA", "IRLANDA", "PORTUGAL", "ESCOCIA", "CROACIA",
      "SERVIA", "BULGÁRIA", "MOLDOVA", "GEORGIA", "ARMENIA"
    ]
  },
  filmes: {
    emoji: "🎬",
    label: "Filmes & Séries",
    palavras: [
      "VINGADORES", "AVATAR", "GLADIADOR", "INTERESTELAR", "PADRINHO",
      "MATRIX", "INCEPTION", "TITANIC", "JURASSIC", "SENHOR",
      "MANDALORIAN", "STRANGER", "BREAKING", "PEAKY", "SIMPSONS",
      "DETETIVE", "SHERLOCK", "NARUTO", "DRAGONBALL", "POKEMON",
      "MINECRAFT", "FORTNITE", "ZELDA", "MARIO", "TETRIS",
      "PREDADOR", "EXTERMINADOR", "TRANSFORMERS", "PIRATAS", "GANDALF",
      "HOGWARTS", "DUMBLEDORE", "VOLDEMORT", "HERMIONE", "GRYFFINDOR",
      "WAKANDA", "PANTERA", "HOMEMARANHA", "WOLVERINE", "MAGNETO"
    ]
  },
  natureza: {
    emoji: "🌿",
    label: "Natureza",
    palavras: [
      "CACHOEIRA", "VULCAO", "TERREMOTO", "TSUNAMI", "FURACAO",
      "TORNADO", "RELAMPAGO", "ARCOIRIS", "AVALANCHE", "GEYSER",
      "FLORESTA", "PANTANAL", "CERRADO", "CAATINGA", "MANGUE",
      "RECIFE", "GLACIAR", "DESERTO", "SAVANA", "TUNDRA",
      "ORQUIDEA", "GIRASSOL", "MARGARIDA", "LAVANDA", "SAMAMBAIA",
      "CACTO", "SEQUOIA", "BAOBÁ", "IPEA", "JACARANDA",
      "MONTANHA", "CAVERNA", "PENINSULA", "ARQUIPELAGO", "ISTMO",
      "PLANALTO", "ESTUARIO", "DELTA", "LITORAL", "CORDILHEIRA"
    ]
  },
  musica: {
    emoji: "🎵",
    label: "Música",
    palavras: [
      "GUITARRA", "BATERIA", "VIOLONCELO", "SAXOFONE", "TROMPETE",
      "CLARINETE", "TROMBONE", "HARPA", "ACORDEAO", "PANDEIRO",
      "TAMBOR", "XILOFONE", "CONTRABAIXO", "CAVAQUINHO", "BANJO",
      "SINFONIA", "CONCERTO", "MELODIA", "HARMONIA", "ORQUESTRA",
      "MAESTRO", "PARTITURA", "COMPOSITOR", "BATUQUE", "REGGAE",
      "SAMBA", "FORRÓ", "BOSSA", "SERTANEJO", "PAGODE",
      "ELETRONICA", "CLASSICA", "ACUSTICO", "AMPLIFICADOR", "MICROFONE",
      "METRONOMO", "AFINADOR", "DIAPASAO", "CORDA", "PALHETA"
    ]
  },
  corpo: {
    emoji: "🧠",
    label: "Corpo Humano",
    palavras: [
      "CEREBRO", "CORACAO", "PULMAO", "FIGADO", "ESTOMAGO",
      "INTESTINO", "ESQUELETO", "CRANIO", "COSTELA", "CLAVICULA",
      "ESCAPULA", "FEMUR", "TIBIA", "FALANGE", "VERTEBRA",
      "TENDAO", "LIGAMENTO", "CARTILAGEM", "MUSCULO", "DIAFRAGMA",
      "TRAQUEIA", "ESOFAGO", "PANCREAS", "APENDICE", "AMIGDALA",
      "RETINA", "CORNEA", "TIMPANO", "LARINGE", "FARINGE",
      "MEDULA", "NEURONIO", "SINAPSE", "HEMACIA", "PLAQUETA",
      "ANTICORPO", "PROTEINA", "ENZIMA", "HORMONIO", "ADRENALINA"
    ]
  }
};

// Histórico de palavras usadas por canal/tema para evitar repetições
const palavrasUsadas = new Map(); // chave: "channelId:tema" => Set de palavras

function getPalavraAleatoria(channelId, tema) {
  const key = `${channelId}:${tema}`;
  if (!palavrasUsadas.has(key)) {
    palavrasUsadas.set(key, []);
  }

  const historico = palavrasUsadas.get(key);
  const listaPalavras = TEMAS[tema].palavras;

  // Filtra as palavras que ainda não foram usadas
  let disponiveis = listaPalavras.filter(p => !historico.includes(p));

  // Se todas foram usadas, reseta o histórico (mantém as últimas 5 para não repetir imediatamente)
  if (disponiveis.length === 0) {
    const ultimas5 = historico.slice(-5);
    palavrasUsadas.set(key, ultimas5);
    disponiveis = listaPalavras.filter(p => !ultimas5.includes(p));
  }

  // Escolhe aleatoriamente
  const palavra = disponiveis[Math.floor(Math.random() * disponiveis.length)];

  // Registra no histórico (mantém no máximo 20 entradas)
  historico.push(palavra);
  if (historico.length > 20) {
    historico.shift();
  }

  return palavra;
}

// ========== PROMPTS DE IMAGEM EM INGLÊS ==========
// Dicionário de descrições em inglês para o Stable Diffusion entender cada palavra

const PROMPT_HINTS = {
  // ---- ANIMAIS ----
  "CACHORRO": "a golden retriever dog sitting in a park",
  "GATO": "a fluffy orange cat lying on a windowsill",
  "ELEFANTE": "a large african elephant in the savanna",
  "GIRAFA": "a tall giraffe eating leaves from a tree",
  "RINOCERONTE": "a rhinoceros standing in the wild grasslands",
  "HIPOPOTAMO": "a hippopotamus in a river with mouth open",
  "CROCODILO": "a crocodile resting on a riverbank",
  "TARTARUGA": "a sea turtle swimming in clear blue ocean water",
  "BORBOLETA": "a colorful monarch butterfly on a flower",
  "ESCORPIAO": "a scorpion on a desert rock",
  "PAPAGAIO": "a colorful parrot perched on a tree branch",
  "TUBARAO": "a great white shark swimming underwater",
  "GOLFINHO": "a dolphin jumping out of the ocean",
  "PINGUIM": "a penguin standing on ice in Antarctica",
  "FLAMINGO": "a pink flamingo standing in shallow water",
  "CAMALEAO": "a chameleon on a branch changing colors",
  "ORNITORRINCO": "a platypus swimming in a river",
  "CAPIVARA": "a capybara resting by a lake",
  "TAMANDUÁ": "an anteater walking through the forest",
  "PREGUICA": "a sloth hanging from a tree branch",
  "GUEPARDO": "a cheetah running at full speed in the savanna",
  "LEOPARDO": "a leopard resting on a tree branch",
  "PANTERA": "a black panther in a dark jungle",
  "AVESTRUZ": "an ostrich running in the desert",
  "PELICANO": "a pelican flying over the ocean",
  "SALAMANDRA": "a bright orange salamander on a mossy rock",
  "IGUANA": "a green iguana basking on a rock",
  "MORCEGO": "a bat flying at night with wings spread",
  "OURICO": "a hedgehog curled up in autumn leaves",
  "CORUJA": "an owl perched on a branch at night",
  "POLVO": "an octopus with tentacles spread underwater",
  "LULA": "a giant squid in deep ocean water",
  "CARANGUEJO": "a crab on a sandy beach",
  "LAGOSTA": "a red lobster on the ocean floor",
  "CAVALO": "a wild horse galloping through a meadow",
  "ARANHA": "a spider on its web with morning dew",
  "FORMIGA": "ants carrying food in a line on the ground, macro photography",
  "JOANINHA": "a ladybug on a green leaf, macro photography",
  "GRILO": "a cricket insect on a blade of grass",
  "LOUVA-DEUS": "a praying mantis on a flower, macro photography",

  // ---- COMIDA ----
  "HAMBURGUER": "a gourmet hamburger with cheese lettuce and tomato",
  "PIZZA": "a pepperoni pizza fresh from the oven",
  "LASANHA": "a delicious layered lasagna on a plate",
  "BRIGADEIRO": "brazilian chocolate truffles brigadeiro on a plate",
  "PAMONHA": "brazilian corn cake pamonha wrapped in corn husks",
  "FEIJOADA": "brazilian feijoada black bean stew in a clay pot",
  "COXINHA": "brazilian fried coxinha snack on a plate",
  "PASTEL": "brazilian fried pastry pastel on a plate",
  "TAPIOCA": "brazilian tapioca crepe with coconut filling",
  "ACAI": "acai bowl with fruits and granola",
  "CHURRASCO": "brazilian barbecue churrasco on a grill",
  "STROGANOFF": "stroganoff with rice on a plate",
  "MACARRAO": "a plate of spaghetti pasta with sauce",
  "CARBONARA": "pasta carbonara with cream sauce and bacon",
  "RISOTO": "creamy mushroom risotto in a bowl",
  "CROISSANT": "a golden flaky croissant on a plate",
  "CAPPUCCINO": "a cup of cappuccino coffee with foam art",
  "MILKSHAKE": "a chocolate milkshake with whipped cream",
  "VITAMINA": "a colorful fruit smoothie in a glass",
  "LIMONADA": "a glass of fresh lemonade with ice and mint",
  "PUDIM": "brazilian caramel pudding flan on a plate",
  "CHURROS": "churros with chocolate dipping sauce",
  "EMPANADA": "golden fried empanadas on a plate",
  "SASHIMI": "sashimi slices of fresh salmon on a plate",
  "TEMAKI": "a temaki hand roll sushi cone",
  "GUACAMOLE": "fresh guacamole with tortilla chips",
  "NACHOS": "loaded nachos with cheese and jalapenos",
  "BRUSCHETTA": "bruschetta with tomato and basil on bread",
  "RAVIOLI": "ravioli pasta with tomato sauce on a plate",
  "TIRAMISU": "a slice of tiramisu dessert with cocoa powder",
  "PANQUECA": "a stack of fluffy pancakes with syrup",
  "WAFFLE": "golden waffles with berries and syrup",
  "GRANOLA": "a bowl of granola with yogurt and fruit",
  "IOGURTE": "a cup of yogurt with berries on top",
  "MOZZARELLA": "mozzarella cheese with tomato and basil",
  "ESPAGUETE": "spaghetti twirled on a fork with sauce",
  "SORVETE": "scoops of colorful ice cream in a cone",
  "CHOCOLATE": "a bar of premium chocolate with cocoa beans",
  "CARAMELO": "caramel candy dripping golden caramel sauce",
  "AMENDOIM": "roasted peanuts in a wooden bowl",

  // ---- TECNOLOGIA ----
  "COMPUTADOR": "a modern desktop computer setup with monitor and keyboard",
  "TELEFONE": "a modern smartphone on a desk",
  "INTERNET": "fiber optic cables glowing with data streams",
  "ALGORITMO": "a complex flowchart diagram on a whiteboard",
  "BLUETOOTH": "bluetooth wireless headphones and devices",
  "PROCESSADOR": "a computer CPU processor chip close-up",
  "TECLADO": "a mechanical gaming keyboard with RGB lights",
  "MONITOR": "a curved ultrawide computer monitor",
  "IMPRESSORA": "a modern 3D printer creating an object",
  "PENDRIVE": "a USB flash drive on a desk",
  "SERVIDOR": "a server room with racks of blinking lights",
  "FIREWALL": "a digital firewall concept with shield and binary",
  "ROTEADOR": "a modern WiFi router with antennas",
  "SATELITE": "a satellite orbiting Earth in space",
  "HOLOGRAFIA": "a holographic display showing a 3D image",
  "CRIPTOGRAFIA": "encryption concept with padlock and binary code",
  "INTELIGENCIA": "artificial intelligence concept with neural network visualization",
  "ROBOTICA": "a futuristic robot arm in a factory",
  "HOLOGRAMA": "a hologram projection of a 3D model",
  "PROGRAMA": "lines of code on a computer screen",
  "NOTEBOOK": "a laptop notebook computer on a wooden desk",
  "TABLET": "a tablet device showing colorful content",
  "FONE": "premium over-ear headphones on a stand",
  "MICROFONE": "a professional studio microphone",
  "WEBCAM": "a webcam mounted on a computer monitor",
  "APLICATIVO": "a smartphone showing colorful app icons",
  "SOFTWARE": "a computer screen showing software interface",
  "HARDWARE": "computer hardware components spread on a table",
  "DOWNLOAD": "a download progress bar on a computer screen",
  "STREAMING": "a streaming setup with multiple screens",
  "PIXEL": "colorful pixel art mosaic pattern",
  "MEGABYTE": "digital data visualization with glowing cubes",
  "GIGABYTE": "a hard drive with data visualization",
  "TERABYTE": "a massive data center with storage arrays",
  "BINARIO": "binary code numbers flowing on a screen",
  "CIRCUITO": "an electronic circuit board with components close-up",
  "TRANSISTOR": "a transistor electronic component macro photography",
  "SIMULACAO": "a virtual reality simulation environment",
  "REALIDADE": "virtual reality VR headset with digital world",
  "VIRTUAL": "a virtual reality landscape with neon grid",

  // ---- ESPORTES ----
  "FUTEBOL": "a soccer ball on a green football field",
  "BASQUETE": "a basketball going through the hoop net",
  "VOLEIBOL": "a volleyball being spiked over the net",
  "NATACAO": "a swimming pool with lanes from above",
  "ATLETISMO": "a running track at a stadium",
  "CICLISMO": "a racing bicycle on a mountain road",
  "ESGRIMA": "fencing swords and mask equipment",
  "BOXE": "boxing gloves hanging on the ropes of a ring",
  "KARATE": "a karate gi uniform with black belt",
  "SURFE": "a surfboard riding a big ocean wave",
  "SKATE": "a skateboard doing a trick at a skatepark",
  "GINASTICA": "gymnastics rings and balance beam equipment",
  "HANDEBOL": "a handball on a court",
  "TENIS": "a tennis racket and ball on a clay court",
  "GOLFE": "a golf ball on a tee on a green course",
  "BADMINTON": "a badminton shuttlecock and racket",
  "POLO": "polo horses and mallets on a field",
  "CANOAGEM": "a canoe kayak on a river with rapids",
  "REMO": "rowing oars on calm water at sunrise",
  "MERGULHO": "scuba diving equipment underwater with coral reef",
  "ESCALADA": "rock climbing wall with colorful holds",
  "MARATONA": "marathon race finish line on a city road",
  "PENTATLO": "pentathlon equipment swords and targets",
  "TRIATHLON": "triathlon cycling swimming running icons",
  "HOQUEI": "ice hockey puck and stick on an ice rink",
  "RUGBY": "a rugby ball on a grass field",
  "BEISEBOL": "a baseball bat and glove on a diamond field",
  "CRICKET": "cricket bat and ball on a pitch",
  "CORRIDA": "a racing car on a track at high speed",
  "ARREMESSO": "shot put ball and throwing circle",
  "TRAMPOLIM": "a trampoline in a gymnasium",
  "SALTO": "high jump bar and landing mat",
  "LUTA": "a wrestling mat in a gymnasium",
  "LEVANTAMENTO": "weightlifting barbell with heavy weights",
  "TREINADOR": "a coach clipboard with strategy diagram",
  "CAMPEONATO": "a championship trophy on a podium",
  "OLIMPIADA": "olympic rings symbol on a stadium",
  "MEDALHA": "gold silver bronze olympic medals",
  "PODIO": "a winners podium with first second third places",
  "ARBITRO": "a referee whistle and yellow red cards",

  // ---- PROFISSÕES ----
  "ASTRONAUTA": "an astronaut space suit helmet floating in space",
  "ENGENHEIRO": "engineering blueprints and hard hat on a construction site",
  "PROFESSOR": "a classroom with a blackboard and chalk",
  "BOMBEIRO": "a fire truck with flashing lights at a fire station",
  "MEDICO": "a stethoscope and medical equipment on a desk",
  "DENTISTA": "dental equipment and tools in a clinic",
  "VETERINARIO": "veterinary clinic with animal care equipment",
  "ADVOGADO": "a law gavel and legal books on a desk",
  "ARQUITETO": "architectural blueprints and building model",
  "COZINHEIRO": "chef hat and cooking utensils in a kitchen",
  "PILOTO": "an airplane cockpit with instruments and controls",
  "MECANICO": "mechanic tools and car engine in a garage",
  "ELETRICISTA": "electrical tools and wiring equipment",
  "ENFERMEIRO": "nursing medical equipment and clipboard",
  "FARMACEUTICO": "pharmacy shelves with medicine bottles",
  "PSICÓLOGO": "a therapy couch and notepad in an office",
  "JORNALISTA": "a newspaper printing press with headlines",
  "FOTOGRAFO": "professional camera equipment and lenses",
  "PROGRAMADOR": "multiple computer monitors showing code",
  "DESIGNER": "a design workspace with tablet and color swatches",
  "AGRICULTOR": "a tractor on a farm field with crops",
  "PESCADOR": "fishing rod and tackle box by a lake",
  "PEDREIRO": "bricks mortar and trowel at a construction site",
  "MARCENEIRO": "woodworking tools and sawdust in a workshop",
  "PADEIRO": "fresh bread loaves in a bakery oven",
  "AÇOUGUEIRO": "a butcher shop with meat display",
  "CARTEIRO": "a mailbox with letters and a mail bag",
  "MOTORISTA": "a steering wheel and dashboard of a vehicle",
  "DETETIVE": "a magnifying glass and detective case files",
  "DELEGADO": "a police badge and handcuffs on a desk",
  "CIENTISTA": "laboratory beakers test tubes and microscope",
  "BIOLOGO": "a microscope viewing cells in a biology lab",
  "QUIMICO": "chemistry lab with colorful bubbling liquids",
  "FISICO": "physics equations on a blackboard with atoms",
  "GEÓLOGO": "geological rock samples and field equipment",
  "ASTRONOMO": "a large telescope pointing at a starry night sky",
  "ECONOMISTA": "financial charts and graphs on screens",
  "CONTADOR": "a calculator and accounting ledger on a desk",
  "BIBLIOTECARIO": "tall library bookshelves full of old books",
  "TRADUTOR": "books in different languages with dictionaries",

  // ---- PAÍSES ----
  "ARGENTINA": "Buenos Aires cityscape with colorful La Boca neighborhood",
  "AUSTRALIA": "Sydney Opera House and Harbour Bridge",
  "ALEMANHA": "Brandenburg Gate in Berlin Germany",
  "BANGLADESH": "colorful boats on rivers of Bangladesh",
  "COLOMBIA": "colorful colonial streets of Cartagena Colombia",
  "DINAMARCA": "Nyhavn colorful harbor houses in Copenhagen Denmark",
  "EQUADOR": "Galapagos Islands with giant tortoise Ecuador",
  "FINLANDIA": "northern lights aurora borealis over Finnish forest",
  "GUATEMALA": "ancient Mayan ruins of Tikal Guatemala",
  "HOLANDA": "windmills and tulip fields in Netherlands",
  "INDONESIA": "Bali Indonesia rice terraces and temples",
  "JAPAO": "Mount Fuji with cherry blossoms in Japan",
  "MADAGASCAR": "baobab trees avenue in Madagascar",
  "NORUEGA": "Norwegian fjords with dramatic cliffs",
  "PARAGUAI": "Itaipu Dam on the Parana River Paraguay",
  "SINGAPURA": "Singapore skyline with Marina Bay Sands",
  "TAILANDIA": "golden Buddhist temple in Bangkok Thailand",
  "URUGUAI": "Montevideo Uruguay waterfront cityscape",
  "VENEZUELA": "Angel Falls the tallest waterfall Venezuela",
  "ZIMBABUE": "Victoria Falls waterfall Zimbabwe",
  "ISTAMBUL": "Blue Mosque and Hagia Sophia Istanbul Turkey",
  "TOQUIO": "Tokyo Japan neon lights Shibuya crossing at night",
  "BARCELONA": "Sagrada Familia basilica in Barcelona Spain",
  "AMSTERDAM": "canal houses and bicycles in Amsterdam",
  "ESTOCOLMO": "colorful old town Gamla Stan Stockholm Sweden",
  "MARROCOS": "blue city of Chefchaouen Morocco",
  "MONGOLIA": "vast Mongolian steppe with yurt and horses",
  "CAZAQUISTAO": "futuristic Nur-Sultan Astana cityscape Kazakhstan",
  "ESLOVAQUIA": "Bratislava Castle on the Danube River Slovakia",
  "ROMENIA": "Bran Castle Dracula castle in Romania",
  "ISLANDIA": "geysers and volcanic landscape of Iceland",
  "IRLANDA": "green rolling hills and cliffs of Ireland",
  "PORTUGAL": "colorful tiled buildings of Lisbon Portugal",
  "ESCOCIA": "Scottish highlands with castle and loch",
  "CROACIA": "Dubrovnik old town walls Croatia",
  "SERVIA": "Belgrade Fortress overlooking rivers Serbia",
  "BULGÁRIA": "Rila Monastery in the mountains Bulgaria",
  "MOLDOVA": "vineyards and countryside of Moldova",
  "GEORGIA": "ancient churches in the mountains of Georgia",
  "ARMENIA": "Mount Ararat and ancient monastery Armenia",

  // ---- FILMES ----
  "VINGADORES": "superhero team assembling movie poster style",
  "AVATAR": "bioluminescent alien forest with floating mountains",
  "GLADIADOR": "a Roman Colosseum arena with gladiator armor",
  "INTERESTELAR": "a black hole in space with accretion disk",
  "PADRINHO": "a dark office with a desk and rose, film noir style",
  "MATRIX": "green digital rain code falling on a black screen",
  "INCEPTION": "a city folding on itself surreal dreamscape",
  "TITANIC": "the Titanic ship on the ocean at night",
  "JURASSIC": "a dinosaur in a tropical jungle, cinematic",
  "SENHOR": "a golden ring on a map of a fantasy world",
  "MANDALORIAN": "a sci-fi bounty hunter helmet with armor",
  "STRANGER": "a dark upside-down world with floating particles",
  "BREAKING": "a chemistry lab in a desert, dramatic lighting",
  "PEAKY": "1920s flat cap hat and razor on a vintage desk",
  "SIMPSONS": "a yellow cartoon family living room, animated style",
  "DETETIVE": "a noir detective desk with magnifying glass and files",
  "SHERLOCK": "221B Baker Street London with pipe and deerstalker hat",
  "NARUTO": "ninja headband on a tree stump, anime style",
  "DRAGONBALL": "glowing orange dragon ball crystal spheres",
  "POKEMON": "a pokeball on grass with sparkles",
  "MINECRAFT": "a blocky pixelated landscape with cubes",
  "FORTNITE": "a colorful battle royale island from above",
  "ZELDA": "a master sword stuck in a stone in a forest",
  "MARIO": "red and green mushrooms and golden coins, game style",
  "TETRIS": "colorful falling geometric blocks puzzle",
  "PREDADOR": "alien jungle with laser sights, sci-fi movie",
  "EXTERMINADOR": "a metallic robot skull with glowing red eye",
  "TRANSFORMERS": "a giant transforming robot in a city",
  "PIRATAS": "a pirate ship sailing on stormy seas",
  "GANDALF": "a wizard staff and pointy hat in a fantasy setting",
  "HOGWARTS": "a magical castle school on a cliff at night",
  "DUMBLEDORE": "a magical elder wand with sparkles",
  "VOLDEMORT": "a dark hooded figure with a snake in shadows",
  "HERMIONE": "magical spell books and wand on a library desk",
  "GRYFFINDOR": "a red and gold lion crest banner in a castle",
  "WAKANDA": "a futuristic african city with vibranium technology",
  "HOMEMARANHA": "a spider web between buildings with city skyline",
  "WOLVERINE": "metallic claws slashing through metal",
  "MAGNETO": "magnetic fields distorting metal objects",

  // ---- NATUREZA ----
  "CACHOEIRA": "a majestic waterfall cascading into a pool",
  "VULCAO": "an erupting volcano with lava and smoke",
  "TERREMOTO": "cracked ground from earthquake damage",
  "TSUNAMI": "a massive ocean wave approaching the shore",
  "FURACAO": "a hurricane spiral storm from satellite view",
  "TORNADO": "a tornado funnel touching down in a field",
  "RELAMPAGO": "lightning bolts striking during a thunderstorm",
  "ARCOIRIS": "a vivid rainbow arching over a green landscape",
  "AVALANCHE": "a snow avalanche rushing down a mountain",
  "GEYSER": "a geyser erupting hot water and steam",
  "FLORESTA": "a dense tropical rainforest with sunlight filtering through",
  "PANTANAL": "the Pantanal wetlands with wildlife and water",
  "CERRADO": "Brazilian cerrado savanna with twisted trees",
  "CAATINGA": "dry Brazilian caatinga landscape with cacti",
  "MANGUE": "mangrove swamp with roots in the water",
  "RECIFE": "a colorful coral reef underwater with fish",
  "GLACIAR": "a massive blue glacier with icebergs",
  "DESERTO": "sand dunes in the Sahara desert at sunset",
  "SAVANA": "african savanna with acacia trees at golden hour",
  "TUNDRA": "arctic tundra landscape with snow and lichen",
  "ORQUIDEA": "a beautiful purple orchid flower close-up",
  "GIRASSOL": "a field of bright yellow sunflowers",
  "MARGARIDA": "white daisy flowers in a green meadow",
  "LAVANDA": "purple lavender fields in Provence",
  "SAMAMBAIA": "lush green fern fronds in a forest",
  "CACTO": "a large cactus in the desert at sunset",
  "SEQUOIA": "a giant sequoia redwood tree looking up",
  "BAOBÁ": "a massive baobab tree in the African savanna",
  "IPEA": "a yellow ipe tree in full bloom, Brazilian landscape",
  "JACARANDA": "a jacaranda tree with purple flowers in a park",
  "MONTANHA": "a snow-capped mountain peak at sunrise",
  "CAVERNA": "a cave interior with stalactites and stalagmites",
  "PENINSULA": "an aerial view of a peninsula surrounded by ocean",
  "ARQUIPELAGO": "an archipelago of tropical islands from above",
  "ISTMO": "a narrow strip of land connecting two landmasses",
  "PLANALTO": "a high plateau landscape with dramatic views",
  "ESTUARIO": "an estuary where river meets the ocean",
  "DELTA": "a river delta seen from above with branching waterways",
  "LITORAL": "a coastline with cliffs and turquoise water",
  "CORDILHEIRA": "a mountain range stretching across the horizon",

  // ---- MÚSICA ----
  "GUITARRA": "an electric guitar with dramatic lighting",
  "BATERIA": "a drum kit set up on a stage",
  "VIOLONCELO": "a cello musical instrument in a concert hall",
  "SAXOFONE": "a golden saxophone with dramatic lighting",
  "TROMPETE": "a brass trumpet on a dark background",
  "CLARINETE": "a clarinet woodwind instrument close-up",
  "TROMBONE": "a trombone brass instrument with golden finish",
  "HARPA": "a golden concert harp with strings",
  "ACORDEAO": "an accordion instrument with colorful design",
  "PANDEIRO": "a Brazilian tambourine pandeiro instrument",
  "TAMBOR": "traditional drums with dramatic lighting",
  "XILOFONE": "a colorful xylophone musical instrument",
  "CONTRABAIXO": "an upright double bass in a jazz club",
  "CAVAQUINHO": "a small Brazilian ukulele cavaquinho instrument",
  "BANJO": "a banjo stringed instrument on a rustic background",
  "SINFONIA": "a symphony orchestra stage with empty seats",
  "CONCERTO": "a concert hall with grand piano on stage",
  "MELODIA": "musical notes flowing from a music box",
  "HARMONIA": "multiple musical instruments arranged harmoniously",
  "ORQUESTRA": "a full orchestra pit with instruments on stands",
  "MAESTRO": "a conductor baton and music stand",
  "PARTITURA": "sheet music pages with musical notation",
  "COMPOSITOR": "a vintage desk with quill pen and sheet music",
  "BATUQUE": "Brazilian percussion drums and instruments",
  "REGGAE": "reggae music vinyl records with Jamaican colors",
  "SAMBA": "Brazilian samba carnival drums and costumes",
  "FORRÓ": "Brazilian accordion and triangle forró instruments",
  "BOSSA": "a guitar and vinyl record in a retro Brazilian setting",
  "SERTANEJO": "acoustic guitar and cowboy hat country music style",
  "PAGODE": "Brazilian pagode party instruments and tambourines",
  "ELETRONICA": "a DJ turntable setup with neon lights",
  "CLASSICA": "a grand piano in an elegant concert hall",
  "ACUSTICO": "an acoustic guitar on a wooden stage",
  "AMPLIFICADOR": "a guitar amplifier stack with knobs",
  "METRONOMO": "a vintage metronome ticking on a piano",
  "AFINADOR": "a tuning fork vibrating with sound waves",
  "DIAPASAO": "a tuning fork on a wooden surface",
  "CORDA": "guitar strings close-up with vibration",
  "PALHETA": "colorful guitar picks spread on a table",

  // ---- CORPO HUMANO ----
  "CEREBRO": "a 3D medical illustration of a human brain",
  "CORACAO": "an anatomical human heart 3D medical illustration",
  "PULMAO": "a 3D medical model of human lungs",
  "FIGADO": "a 3D medical illustration of a human liver",
  "ESTOMAGO": "a 3D medical illustration of a human stomach",
  "INTESTINO": "a medical diagram of the intestinal system",
  "ESQUELETO": "a full human skeleton on a black background",
  "CRANIO": "a human skull anatomical model",
  "COSTELA": "a ribcage anatomical model",
  "CLAVICULA": "a 3D medical illustration of the clavicle bone",
  "ESCAPULA": "a 3D medical illustration of the shoulder blade",
  "FEMUR": "a femur bone anatomical model",
  "TIBIA": "a tibia bone anatomical model",
  "FALANGE": "finger bones phalanges anatomical model",
  "VERTEBRA": "a spine vertebra anatomical model",
  "TENDAO": "a 3D medical illustration of tendons and joints",
  "LIGAMENTO": "a 3D medical illustration of knee ligaments",
  "CARTILAGEM": "a 3D medical illustration of cartilage tissue",
  "MUSCULO": "a 3D medical illustration of muscle fibers",
  "DIAFRAGMA": "a 3D medical illustration of the diaphragm",
  "TRAQUEIA": "a 3D medical illustration of the trachea windpipe",
  "ESOFAGO": "a 3D medical illustration of the esophagus",
  "PANCREAS": "a 3D medical illustration of the pancreas organ",
  "APENDICE": "a 3D medical illustration of the appendix",
  "AMIGDALA": "a 3D medical illustration of tonsils",
  "RETINA": "a close-up of the retina of an eye, medical illustration",
  "CORNEA": "a close-up medical illustration of the cornea of the eye",
  "TIMPANO": "a 3D medical illustration of the eardrum",
  "LARINGE": "a 3D medical illustration of the larynx",
  "FARINGE": "a 3D medical illustration of the pharynx throat",
  "MEDULA": "a 3D medical illustration of the spinal cord",
  "NEURONIO": "a neuron cell with synapses under microscope",
  "SINAPSE": "neural synapses firing with electric impulses",
  "HEMACIA": "red blood cells flowing through a blood vessel",
  "PLAQUETA": "platelets and blood cells under microscope",
  "ANTICORPO": "antibodies attacking a virus cell, medical illustration",
  "PROTEINA": "a 3D protein molecule structure",
  "ENZIMA": "an enzyme molecular structure 3D illustration",
  "HORMONIO": "hormone molecules interacting with receptors",
  "ADRENALINA": "adrenaline molecule structure with dramatic colors"
};

// Contexto por tema para enriquecer prompts que não estão no dicionário
const TEMA_CONTEXT = {
  animais: "wildlife nature photography,",
  comida: "food photography, appetizing,",
  tecnologia: "technology concept,",
  esportes: "sports photography, athletic,",
  profissoes: "workplace professional setting,",
  paises: "travel landmark photography,",
  filmes: "cinematic movie scene,",
  natureza: "nature landscape photography,",
  musica: "musical instrument photography,",
  corpo: "medical scientific illustration,"
};

function getImagePrompt(word, tema) {
  const hint = PROMPT_HINTS[word];
  const temaContext = TEMA_CONTEXT[tema] || "";

  if (hint) {
    return `${temaContext} ${hint}, high quality, sharp detail, vibrant colors, professional photography, masterpiece, no people, no face`;
  }

  // Fallback: usa a palavra em inglês genérica (melhor que português cru)
  return `${temaContext} ${word.toLowerCase()}, high quality, sharp detail, vibrant colors, professional photography, masterpiece, no people, no face`;
}

// ========== VISUAL DO JOGO ==========

const FORCA_FACES = [
  "💀 (Enforcado!)",
  "😵 (Quase lá...)",
  "🤕 (Machucado)",
  "😨 (Desesperado)",
  "😟 (Assustado)",
  "😐 (Preocupado)",
  "🙂 (Tranquilo)"
];

function maskWord(word, guessed) {
  return word.split("").map(char => guessed.has(char) ? char : "_").join(" ");
}

function getForcaEmbedText(gameState) {
  const face = FORCA_FACES[gameState.lives];
  const masked = maskWord(gameState.word, gameState.guessed);
  const chutes = Array.from(gameState.guessed).join(", ") || "Nenhum";
  const coracoes = "❤️ ".repeat(gameState.lives) + "🖤 ".repeat(6 - gameState.lives);
  const temaInfo = TEMAS[gameState.tema] ? `${TEMAS[gameState.tema].emoji} ${TEMAS[gameState.tema].label}` : "Aleatório";

  return `🎮 **JOGO DA FORCA DA IA!**
Tema: **${temaInfo}**
Chute uma letra enviando-a sozinha no chat.

**Palavra:** \`${masked}\`
**Chutes:** ${chutes}

**Status:** ${face}
**Vidas:** ${coracoes}`;
}

function resetForcaTimer(channelId, channel) {
  const gameState = forcaGames.get(channelId);
  if (!gameState) return;

  if (gameState.timerId) clearTimeout(gameState.timerId);

  gameState.timerId = setTimeout(() => {
    if (forcaGames.has(channelId)) {
      const g = forcaGames.get(channelId);
      forcaGames.delete(channelId);
      if (g.mainMessage) {
        g.mainMessage.edit(`⏰ **O JOGO EXPIROU POR INATIVIDADE!**\nA palavra era **${g.word}**!\n\n${getForcaEmbedText(g)}`).catch(() => null);
      }
    }
  }, 300000); // 5 minutes
}

// ========== MENU DE SELEÇÃO DE TEMA ==========

// Guardar temporariamente quem está escolhendo tema
const pendingThemeSelection = new Map();

async function handleForcaCommand(message) {
  const channelId = message.channel.id;
  if (forcaGames.has(channelId)) {
    return message.reply("❌ Já tem um jogo da forca rolando neste canal! Adivinhe a palavra ou espere acabar.");
  }

  // Se já tem um menu de seleção pendente, ignora
  if (pendingThemeSelection.has(channelId)) {
    return message.reply("❌ Já tem uma escolha de tema pendente neste canal! Escolha um tema ou espere expirar.");
  }

  // Criar botões de temas (máx 5 por row, temos 10 temas = 2 rows)
  const temaKeys = Object.keys(TEMAS);
  const row1 = new ActionRowBuilder().addComponents(
    ...temaKeys.slice(0, 5).map(key =>
      new ButtonBuilder()
        .setCustomId(`forca_tema_${key}`)
        .setLabel(`${TEMAS[key].emoji} ${TEMAS[key].label}`)
        .setStyle(ButtonStyle.Primary)
    )
  );
  const row2 = new ActionRowBuilder().addComponents(
    ...temaKeys.slice(5, 10).map(key =>
      new ButtonBuilder()
        .setCustomId(`forca_tema_${key}`)
        .setLabel(`${TEMAS[key].emoji} ${TEMAS[key].label}`)
        .setStyle(ButtonStyle.Primary)
    )
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("forca_tema_aleatorio")
      .setLabel("🎲 Aleatório (Surpresa!)")
      .setStyle(ButtonStyle.Success)
  );

  const menuMsg = await message.reply({
    content: "🎮 **JOGO DA FORCA** — Escolha o tema!\nSelecione uma categoria abaixo para começar:",
    components: [row1, row2, row3]
  });

  pendingThemeSelection.set(channelId, {
    messageId: menuMsg.id,
    userId: message.author.id,
    originalMessage: message
  });

  // Expira em 60 segundos se ninguém escolher
  setTimeout(() => {
    if (pendingThemeSelection.has(channelId)) {
      pendingThemeSelection.delete(channelId);
      menuMsg.edit({ content: "⏰ Tempo de seleção expirou! Use `!forca` de novo.", components: [] }).catch(() => null);
    }
  }, 60000);
}

async function handleForcaThemeInteraction(interaction) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith("forca_tema_")) return false;

  const channelId = interaction.channel.id;
  const pending = pendingThemeSelection.get(channelId);
  if (!pending) {
    await interaction.reply({ content: "Esse menu já expirou! Use `!forca` de novo.", flags: MessageFlags.Ephemeral });
    return true;
  }

  pendingThemeSelection.delete(channelId);

  const temaKey = interaction.customId.replace("forca_tema_", "");
  let temaEscolhido;

  if (temaKey === "aleatorio") {
    const keys = Object.keys(TEMAS);
    temaEscolhido = keys[Math.floor(Math.random() * keys.length)];
  } else {
    temaEscolhido = temaKey;
  }

  if (!TEMAS[temaEscolhido]) {
    await interaction.reply({ content: "❌ Tema inválido!", flags: MessageFlags.Ephemeral });
    return true;
  }

  // Iniciar o jogo com o tema escolhido
  const word = getPalavraAleatoria(channelId, temaEscolhido);
  const gameState = {
    word: word,
    tema: temaEscolhido,
    guessed: new Set(),
    lives: 6,
    mainMessage: null,
    timerId: null
  };

  forcaGames.set(channelId, gameState);
  resetForcaTimer(channelId, interaction.channel);

  // Atualiza o menu para mostrar que o tema foi selecionado
  await interaction.update({
    content: `🎮 Tema escolhido: **${TEMAS[temaEscolhido].emoji} ${TEMAS[temaEscolhido].label}**! Gerando dica visual...`,
    components: []
  });

  // Gerar imagem e começar o jogo
  const promptDesc = getImagePrompt(word, temaEscolhido);
  const forcaNegative = config.FORGE_REALISTIC_NEGATIVE_PROMPT + ", woman, girl, man, boy, face, portrait, person, human face, selfie, headshot, asian, korean, japanese, close-up face";

  const payload = {
    prompt: promptDesc,
    negative_prompt: forcaNegative,
    steps: 20,
    cfg_scale: 7.5,
    width: 512,
    height: 512,
    override_settings: {
      sd_model_checkpoint: config.FORGE_REALISTIC_MODEL
    },
    sampler_name: config.FORGE_SAMPLER,
    batch_size: 1
  };

  try {
    await assertForgeReady();
    const response = await fetch(`${config.FORGE_HOST}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.images[0];
    const buffer = Buffer.from(imageBase64, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "dica_forca.png" });

    const mainMsg = await interaction.channel.send({
      content: getForcaEmbedText(gameState),
      files: [attachment]
    });
    gameState.mainMessage = mainMsg;

  } catch (err) {
    console.error("Erro no forge forca:", err);
    const mainMsg = await interaction.channel.send(`⚠️ Não consegui gerar a imagem da dica (${err.message}), mas o jogo continua!\n\n${getForcaEmbedText(gameState)}`);
    gameState.mainMessage = mainMsg;
  }

  return true;
}

// ========== LÓGICA DE CHUTES ==========

// Retorna true se a mensagem foi tratada pelo jogo da forca
function checkForcaGuess(message) {
  const channelId = message.channel.id;
  const gameState = forcaGames.get(channelId);
  if (!gameState) return false;

  // Se a mainMessage ainda não foi definida (imagem carregando), ignora os chutes
  if (!gameState.mainMessage) return false;

  const text = message.content.trim().toUpperCase();

  // Chute de letra única
  if (text.length === 1 && /[A-Z]/.test(text)) {
    message.delete().catch(() => null); // Apaga o chute para limpar o chat
    resetForcaTimer(channelId, message.channel);

    if (gameState.guessed.has(text)) {
      return true; // Ignora letras repetidas silenciosamente
    }

    gameState.guessed.add(text);

    if (!gameState.word.includes(text)) {
      gameState.lives--;
    } else {
      // Letra correta! Ganha 1 Nanacoin
      addCoins(message.author.id, 1);
    }

    const won = gameState.word.split("").every(char => gameState.guessed.has(char));

    if (won) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      const { getGameMultiplier } = require("./boosts");
      const mult = getGameMultiplier(message.author.id);
      const reward = 50 * mult;
      addCoins(message.author.id, reward);
      const multMsg = mult > 1 ? ` *(x${mult} Boost!)*` : "";
      gameState.mainMessage.edit(`🎉 **VITÓRIA!** O jogador ${message.author.username} adivinhou a última letra e ganhou **${reward} Nanacoins 🪙**${multMsg}!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else if (gameState.lives <= 0) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      gameState.mainMessage.edit(`💀 **GAME OVER!** Vocês foram enforcados!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else {
      gameState.mainMessage.edit(getForcaEmbedText(gameState)).catch(() => null);
      return true;
    }
  }

  // Chute da palavra inteira
  if (text.length > 1 && /^[A-Z]+$/.test(text)) {
    message.delete().catch(() => null); // Apaga o chute do chat
    resetForcaTimer(channelId, message.channel);

    if (text === gameState.word) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      const { getGameMultiplier } = require("./boosts");
      const mult = getGameMultiplier(message.author.id);
      const reward = 150 * mult;
      addCoins(message.author.id, reward); // Recompensa Épica
      const multMsg = mult > 1 ? ` *(x${mult} Boost!)*` : "";
      gameState.mainMessage.edit(`🎉 **VITÓRIA ÉPICA!** O jogador ${message.author.username} adivinhou a palavra inteira de uma vez e ganhou **${reward} Nanacoins 🪙**${multMsg}!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else {
      gameState.lives--;
      if (gameState.lives <= 0) {
        if (gameState.timerId) clearTimeout(gameState.timerId);
        forcaGames.delete(channelId);
        removeCoins(message.author.id, 30);
        gameState.mainMessage.edit(`💀 **GAME OVER!** O jogador ${message.author.username} chutou a palavra errada, matou o boneco e perdeu **30 Nanacoins 🪙**!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
        return true;
      } else {
        gameState.mainMessage.edit(`❌ Palavra errada! Perderam 1 vida.\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
        return true;
      }
    }
  }

  return false;
}

// ========== EVENTOS ALEATÓRIOS ==========

let lastEventTime = Date.now();
let activeEventMsgId = null;

async function checkAndSpawnEvent(message) {
  // A cada 2 horas
  if (Date.now() - lastEventTime > 2 * 60 * 60 * 1000) {
    lastEventTime = Date.now();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("event_claim_btn")
        .setLabel("🎁 PEGAR 200 NANACOINS!")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await message.channel.send({
      content: "🚨 **EVENTO ALEATÓRIO APARECEU!** 🚨\nO primeiro a clicar no botão ganha **200 Nanacoins 🪙**!",
      components: [row]
    });

    activeEventMsgId = msg.id;

    // O evento expira em 10 minutos se ninguém pegar
    setTimeout(() => {
      if (activeEventMsgId === msg.id) {
        activeEventMsgId = null;
        msg.edit({ content: "⏰ **EVENTO EXPIRADO!** Ninguém pegou o baú a tempo...", components: [] }).catch(() => null);
      }
    }, 10 * 60 * 1000);
  }
}

async function handleEventInteraction(interaction) {
  if (!interaction.isButton() || interaction.customId !== "event_claim_btn") return false;

  if (activeEventMsgId !== interaction.message.id) {
    await interaction.reply({ content: "Esse evento já foi reivindicado ou expirou!", flags: MessageFlags.Ephemeral });
    return true;
  }

  // Reivindica o prêmio
  activeEventMsgId = null;
  addCoins(interaction.user.id, 200);

  await interaction.update({
    content: `🎉 **EVENTO CONCLUÍDO!** 🎉\nO jogador **${interaction.user.username}** foi o mais rápido e resgatou os **200 Nanacoins 🪙**!`,
    components: []
  });

  return true;
}

module.exports = {
  handleForcaCommand,
  handleForcaThemeInteraction,
  checkForcaGuess,
  checkAndSpawnEvent,
  handleEventInteraction
};
