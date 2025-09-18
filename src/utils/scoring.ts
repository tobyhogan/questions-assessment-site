import { Quiz, QuizAnswer, QuizResult, Question } from '../types/quiz';

export const calculateQuizScores = (
  quiz: Quiz,
  questions: Question[],
  answers: QuizAnswer[]
): QuizResult => {
  // Initialize scores for each scale
  const scores: { [scaleId: string]: number } = {};
  quiz.scales.forEach(scale => {
    scores[scale.id] = 0;
  });

  // Calculate scores based on answers
  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (question) {
      const selectedOption = question.options[answer.selectedOption];
      if (selectedOption && selectedOption.weights) {
        // Add weights to corresponding scales
        Object.entries(selectedOption.weights).forEach(([scaleId, weight]) => {
          if (scores.hasOwnProperty(scaleId)) {
            scores[scaleId] += weight;
          }
        });
      }
    }
  });

  // Determine personality type (for MBTI)
  let personalityType: string | undefined;
  if (quiz.personalityTypes) {
    personalityType = determinePersonalityType(quiz, scores);
  }

  return {
    quizId: quiz.id,
    scores,
    personalityType,
    completedAt: new Date()
  };
};

const determinePersonalityType = (quiz: Quiz, scores: { [scaleId: string]: number }): string => {
  // For MBTI, determine the dominant preference for each dimension
  let type = '';
  
  // Only process MBTI quiz types
  if (quiz.id !== 'mbti-personality') {
    return 'Unknown';
  }
  
  // Extraversion (E) vs Introversion (I)
  const eiScore = scores['EI'] || 0;
  type += eiScore > 0 ? 'E' : 'I';
  
  // Sensing (S) vs Intuition (N) - note: positive is S, negative is N
  const snScore = scores['SN'] || 0;
  type += snScore > 0 ? 'S' : 'N';
  
  // Thinking (T) vs Feeling (F) - note: positive is T, negative is F
  const tfScore = scores['TF'] || 0;
  type += tfScore > 0 ? 'T' : 'F';
  
  // Judging (J) vs Perceiving (P) - note: positive is J, negative is P
  const jpScore = scores['JP'] || 0;
  type += jpScore > 0 ? 'J' : 'P';
  
  return type;
};

export const getScaleDescription = (scaleId: string, score: number, quiz: Quiz): string => {
  const scale = quiz.scales.find(s => s.id === scaleId);
  if (!scale) return '';
  
  const absScore = Math.abs(score);
  const tendency = score > 0 ? scale.positiveLabel : scale.negativeLabel;
  
  let strength = '';
  if (absScore >= 20) strength = 'Strong';
  else if (absScore >= 10) strength = 'Moderate';
  else if (absScore >= 5) strength = 'Slight';
  else strength = 'Balanced';
  
  if (strength === 'Balanced') {
    return `Balanced between ${scale.positiveLabel} and ${scale.negativeLabel}`;
  }
  
  return `${strength} preference for ${tendency}`;
};

export const formatScoreForDisplay = (score: number): string => {
  return score > 0 ? `+${score}` : `${score}`;
};
