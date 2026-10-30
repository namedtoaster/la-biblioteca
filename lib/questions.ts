import { dayNumber } from './days';

// Question text is licensed CC BY-SA 4.0 so it can be reused and translated.
export type Question = {
  id: string;
  text: string;
  hint: string;
  words: [string, string, string];
};

export const QUESTIONS: Question[] = [
  { id: 'desayuno', text: '¿Qué desayunaste hoy?', hint: 'What did you have for breakfast today?', words: ['el desayuno', 'un café', 'pan tostado'] },
  { id: 'casa', text: '¿Cómo es tu casa?', hint: 'What is your home like?', words: ['la cocina', 'grande', 'pequeña'] },
  { id: 'fin-de-semana', text: '¿Qué hiciste el fin de semana?', hint: 'What did you do on the weekend?', words: ['el sábado', 'salí', 'descansé'] },
  { id: 'mascotas', text: '¿Tienes mascotas? Cuéntame de ellas.', hint: 'Do you have pets? Tell me about them.', words: ['el perro', 'el gato', 'se llama'] },
  { id: 'comida', text: '¿Cuál es tu comida favorita?', hint: 'What is your favorite food?', words: ['me encanta', 'picante', 'dulce'] },
  { id: 'tiempo', text: '¿Qué tiempo hace hoy donde vives?', hint: "What's the weather like today where you live?", words: ['hace calor', 'hace frío', 'llueve'] },
  { id: 'por-que', text: '¿Por qué quieres aprender español?', hint: 'Why do you want to learn Spanish?', words: ['quiero', 'viajar', 'hablar con'] },
  { id: 'musica', text: '¿Qué música te gusta?', hint: 'What music do you like?', words: ['la canción', 'escucho', 'mi grupo favorito'] },
  { id: 'amigo', text: 'Describe a tu mejor amigo o amiga.', hint: 'Describe your best friend.', words: ['es muy', 'divertido', 'nos conocimos'] },
  { id: 'dia-normal', text: '¿Qué haces en un día normal?', hint: 'What do you do on a normal day?', words: ['me levanto', 'trabajo', 'por la tarde'] },
  { id: 'viajar', text: '¿Adónde te gustaría viajar?', hint: 'Where would you like to travel?', words: ['me gustaría', 'la playa', 'conocer'] },
  { id: 'serie', text: '¿Qué serie o película viste hace poco?', hint: 'What show or movie did you watch recently?', words: ['vi', 'me gustó', 'trata de'] },
  { id: 'anoche', text: '¿Qué hiciste anoche?', hint: 'What did you do last night?', words: ['anoche', 'cené', 'me acosté'] },
  { id: 'lugar', text: '¿Cuál es tu lugar favorito de tu ciudad?', hint: "What's your favorite place in your town?", words: ['el parque', 'cerca de', 'voy a menudo'] },
  { id: 'cocinar', text: '¿Sabes cocinar? ¿Qué cocinas?', hint: 'Can you cook? What do you make?', words: ['cocino', 'la receta', 'fácil'] },
  { id: 'reir', text: '¿Qué te hace reír?', hint: 'What makes you laugh?', words: ['me hace reír', 'gracioso', 'los chistes'] },
  { id: 'trabajo', text: 'Cuéntame de tu trabajo o tus estudios.', hint: 'Tell me about your job or your studies.', words: ['trabajo en', 'estudio', 'me gusta porque'] },
  { id: 'planes', text: '¿Qué vas a hacer este fin de semana?', hint: 'What are you going to do this weekend?', words: ['voy a', 'quizás', 'con mi familia'] },
  { id: 'manana-noche', text: '¿Prefieres la mañana o la noche? ¿Por qué?', hint: 'Are you a morning or a night person? Why?', words: ['prefiero', 'porque', 'temprano'] },
  { id: 'deporte', text: '¿Qué deporte o ejercicio te gusta?', hint: 'What sport or exercise do you like?', words: ['camino', 'juego al', 'nunca'] },
  { id: 'primer-trabajo', text: '¿Cuál fue tu primer trabajo?', hint: 'What was your first job?', words: ['mi primer trabajo', 'tenía ... años', 'fue'] },
];

/** Everyone whose local date is the same gets the same question. */
export function questionFor(key: string): Question {
  const n = dayNumber(key);
  return QUESTIONS[((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];
}
