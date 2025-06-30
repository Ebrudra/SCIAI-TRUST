import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface FeedbackPanelProps {
  summaryId: string;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ summaryId }) => {
  const [feedback, setFeedback] = useState({
    rating: 0,
    helpful: false,
    accuracy: 0,
    comments: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleAccuracyChange = (accuracy: number) => {
    setFeedback(prev => ({ ...prev, accuracy }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedback.rating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      await ApiService.submitFeedback(summaryId, feedback);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Thank You for Your Feedback!</h3>
        <p className="text-gray-600">
          Your input helps us improve the accuracy and usefulness of our AI analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Help Us Improve</h3>
        <p className="text-blue-700 text-sm">
          Your feedback is essential for improving AI transparency and building trust in research applications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate the overall quality of this summary?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`p-1 ${
                  star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {feedback.rating === 0 ? 'Click to rate' : `${feedback.rating}/5 stars`}
            </span>
          </div>
        </div>

        {/* Helpfulness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Was this summary helpful for your research?
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setFeedback(prev => ({ ...prev, helpful: true }))}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                feedback.helpful === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Yes, helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedback(prev => ({ ...prev, helpful: false }))}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                feedback.helpful === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Not helpful</span>
            </button>
          </div>
        </div>

        {/* Accuracy Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How accurate was the AI's interpretation of the paper?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleAccuracyChange(star)}
                className={`p-1 ${
                  star <= feedback.accuracy ? 'text-blue-400' : 'text-gray-300'
                } hover:text-blue-400 transition-colors`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {feedback.accuracy === 0 ? 'Rate accuracy' : `${feedback.accuracy}/5 stars`}
            </span>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label htmlFor="feedback-comments" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="feedback-comments"
            rows={4}
            value={feedback.comments}
            onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="Share any specific insights about the accuracy, usefulness, or areas for improvement..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={feedback.rating === 0 || isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Privacy Notice</h4>
        <p className="text-sm text-gray-700">
          Your feedback is used solely to improve our AI systems. We do not store personal information 
          and all feedback is anonymized for analysis.
        </p>
      </div>
    </div>
  );
};

export default FeedbackPanel;