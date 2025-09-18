import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizData, Question, QuizAnswer } from '../types/quiz';

const QuizTaking = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) return;
      
      try {
        // Fetch quiz metadata
        const quizResponse = await fetch('/assessment-data/quizzes.json');
        if (!quizResponse.ok) throw new Error('Failed to fetch quiz data');
        
        const quizList = await quizResponse.json();
        const selectedQuiz = quizList.quizzes.find((q: Quiz) => q.id === quizId);
        
        if (!selectedQuiz) throw new Error('Quiz not found');
        setQuiz(selectedQuiz);

        // Fetch quiz questions
        const questionsResponse = await fetch(`/assessment-data/${quizId}.json`);
        if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
        
        const questionsData: QuizData = await questionsResponse.json();
        setQuestions(questionsData.questions);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedOption: selectedOption
    };

    // Update answers array
    const updatedAnswers = [...answers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      a => a.questionId === currentQuestion.id
    );
    
    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }
    
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      // Quiz complete - navigate to results
      navigate(`/results/${quizId}`, { 
        state: { 
          answers: updatedAnswers,
          quiz: quiz 
        } 
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Load previous answer if it exists
      const currentQuestion = questions[currentQuestionIndex - 1];
      const existingAnswer = answers.find(a => a.questionId === currentQuestion.id);
      setSelectedOption(existingAnswer ? existingAnswer.selectedOption : null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !quiz || !questions.length) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error || 'Quiz data not found'}</span>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
          {currentQuestion.text}
        </h2>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedOption === index && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-700">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            currentQuestionIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            selectedOption === null
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QuizTaking;
