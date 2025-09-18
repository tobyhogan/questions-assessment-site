import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizData, Question, QuizAnswer } from '../types/quiz';

const QUESTIONS_PER_PAGE = 8;

const QuizTaking = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [pageAnswers, setPageAnswers] = useState<{ [questionId: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate pages
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentPageQuestions = questions.slice(
    currentPageIndex * QUESTIONS_PER_PAGE,
    (currentPageIndex + 1) * QUESTIONS_PER_PAGE
  );

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

  // Load existing answers for the current page
  useEffect(() => {
    const currentPageAnswerMap: { [questionId: number]: number } = {};
    
    currentPageQuestions.forEach(question => {
      const existingAnswer = answers.find(a => a.questionId === question.id);
      if (existingAnswer !== undefined) {
        currentPageAnswerMap[question.id] = existingAnswer.selectedOption;
      }
    });
    
    setPageAnswers(currentPageAnswerMap);
  }, [currentPageIndex, questions, answers]);

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setPageAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const areAllQuestionsAnswered = () => {
    return currentPageQuestions.every(question => 
      pageAnswers[question.id] !== undefined
    );
  };

  const handleNext = () => {
    // Save current page answers
    const updatedAnswers = [...answers];
    
    currentPageQuestions.forEach(question => {
      if (pageAnswers[question.id] !== undefined) {
        const newAnswer: QuizAnswer = {
          questionId: question.id,
          selectedOption: pageAnswers[question.id]
        };
        
        const existingAnswerIndex = updatedAnswers.findIndex(
          a => a.questionId === question.id
        );
        
        if (existingAnswerIndex >= 0) {
          updatedAnswers[existingAnswerIndex] = newAnswer;
        } else {
          updatedAnswers.push(newAnswer);
        }
      }
    });
    
    setAnswers(updatedAnswers);

    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
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
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
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

  const overallProgress = ((currentPageIndex + 1) / totalPages) * 100;
  const pageProgress = (Object.keys(pageAnswers).length / currentPageQuestions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            Page {currentPageIndex + 1} of {totalPages}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Current Page Progress</span>
            <span>{Math.round(pageProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${pageProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="space-y-8">
          {currentPageQuestions.map((question, questionIndex) => (
            <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                <span className="text-blue-600 mr-2">
                  {currentPageIndex * QUESTIONS_PER_PAGE + questionIndex + 1}.
                </span>
                {question.text}
              </h2>

              {question.type === 'likert-scale' ? (
                // Likert Scale Response
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[
                      'Strongly Disagree',
                      'Disagree', 
                      'Neutral',
                      'Agree',
                      'Strongly Agree'
                    ].map((label, optionIndex) => (
                      <div key={optionIndex} className="text-center">
                        <button
                          onClick={() => handleAnswerSelect(question.id, optionIndex)}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 mb-2 ${
                            pageAnswers[question.id] === optionIndex
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 mx-auto mb-1 ${
                            pageAnswers[question.id] === optionIndex
                              ? 'border-white bg-white'
                              : 'border-gray-400'
                          }`}>
                            {pageAnswers[question.id] === optionIndex && (
                              <div className="w-3 h-3 rounded-full bg-blue-500 m-0.5"></div>
                            )}
                          </div>
                        </button>
                        <span className="text-xs text-gray-600 font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Multiple Choice (for backward compatibility)
                <div className="space-y-3">
                  {question.options?.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(question.id, optionIndex)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        pageAnswers[question.id] === optionIndex
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                          pageAnswers[question.id] === optionIndex
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {pageAnswers[question.id] === optionIndex && (
                            <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                          )}
                        </div>
                        <span className="text-gray-700">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentPageIndex === 0}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            currentPageIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous Page
        </button>

        <div className="text-sm text-gray-600">
          {Object.keys(pageAnswers).length} of {currentPageQuestions.length} questions answered
        </div>

        <button
          onClick={handleNext}
          disabled={!areAllQuestionsAnswered()}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            !areAllQuestionsAnswered()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {currentPageIndex < totalPages - 1 ? 'Next Page' : 'Finish Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QuizTaking;
