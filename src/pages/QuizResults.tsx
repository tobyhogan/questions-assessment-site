import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Quiz, QuizAnswer, QuizResult, QuizData } from '../types/quiz';
import { calculateQuizScores, getScaleDescription, formatScoreForDisplay } from '../utils/scoring';

const QuizResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateResults = async () => {
      try {
        const state = location.state as { answers: QuizAnswer[]; quiz: Quiz } | null;
        
        if (!state || !state.answers || !state.quiz) {
          throw new Error('No quiz data found. Please retake the assessment.');
        }

        const { answers, quiz: quizData } = state;
        
        // Fetch the questions to calculate scores
        const questionsResponse = await fetch(`/assessment-data/${quizId}.json`);
        if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
        
        const questionsData: QuizData = await questionsResponse.json();
        
        // Calculate the results
        const quizResult = calculateQuizScores(quizData, questionsData.questions, answers);
        
        setResult(quizResult);
        setQuiz(quizData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    calculateResults();
  }, [quizId, location.state]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !result || !quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || 'Results not found'}</span>
        </div>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const personalityTypeDescription = quiz.personalityTypes && result.personalityType 
    ? quiz.personalityTypes[result.personalityType] 
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
        <p className="text-lg text-gray-600">{quiz.title} Results</p>
      </div>

      {/* Personality Type Result (if applicable) */}
      {result.personalityType && personalityTypeDescription && (
        <div className="bg-blue-50 rounded-lg p-8 mb-8 border-2 border-blue-200">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-blue-900 mb-2">
              {result.personalityType}
            </h2>
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              {personalityTypeDescription}
            </h3>
            <p className="text-blue-600">
              Your Myers-Briggs personality type indicates your preferences across four key dimensions.
            </p>
          </div>
        </div>
      )}

      {/* Scale Scores */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Score Breakdown</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {quiz.scales.map(scale => {
            const score = result.scores[scale.id] || 0;
            const absScore = Math.abs(score);
            const maxScore = 40; // Approximate max score for visualization
            const percentage = Math.min((absScore / maxScore) * 100, 100);
            
            return (
              <div key={scale.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{scale.name}</h3>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                    score > 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {formatScoreForDisplay(score)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{scale.description}</p>
                
                {/* Score Visualization */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{scale.negativeLabel}</span>
                    <span>{scale.positiveLabel}</span>
                  </div>
                  
                  <div className="relative h-3 bg-gray-200 rounded-full">
                    <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-400"></div>
                    <div 
                      className={`absolute top-0 h-3 rounded-full transition-all duration-500 ${
                        score >= 0 ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                      style={{
                        left: score >= 0 ? '50%' : `${50 - percentage/2}%`,
                        width: `${percentage/2}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-gray-700">
                  {getScaleDescription(scale.id, score, quiz)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Understanding Your Results</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            • <strong>Positive scores</strong> indicate a preference for the first trait in each dimension
          </p>
          <p>
            • <strong>Negative scores</strong> indicate a preference for the second trait in each dimension
          </p>
          <p>
            • <strong>Higher absolute values</strong> indicate stronger preferences
          </p>
          <p>
            • <strong>Scores near zero</strong> indicate balanced preferences between both traits
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Take Another Assessment
        </Link>
        
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Results
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
