import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Route } from "./+types/home";
import { SavedAnswers, type SavedAnswer } from "../components/SavedAnswers";
import { MarkdownDisplay } from "../components/MarkdownDisplay";
import { FeatureBar } from "../components/FeatureBar";
import { RegularSearchResults } from "../components/RegularSearchResults";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search UI" },
    { name: "description", content: "Search through your documents" },
  ];
}

// Define the expected API response structure
type AskApiResponse = {
  answer?: string;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRegularSearch, setIsRegularSearch] = useState(false);
  const [regularSearchResults, setRegularSearchResults] = useState<any>(null);

  const [savedAnswersList, setSavedAnswersList] = useState<SavedAnswer[]>([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State for search suggestions
  const [suggestions, setSuggestions] = useState<SavedAnswer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null); // Ref for handling clicks outside
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea element

  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const fetchSavedAnswers = useCallback(async () => {
    setIsSidebarLoading(true);
    setSidebarError(null);
    let realAnswers: SavedAnswer[] = []; // Store real answers temporarily
    try {
      const response = await fetch("/api/saved");
      type SavedListApiResponse = {
        success: boolean;
        answers?: SavedAnswer[];
        error?: string;
        details?: string;
      };
      const data: SavedListApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.details || "Failed to fetch saved answers"
        );
      }
      realAnswers = data.answers || []; // Store fetched answers
      setSavedAnswersList(realAnswers); // Set initial real answers
    } catch (err) {
      setSidebarError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching saved answers:", err);
    } finally {
      setIsSidebarLoading(false);
    }
  }, []); // Keep dependency array empty

  useEffect(() => {
    fetchSavedAnswers();
  }, [fetchSavedAnswers]);

  // Handle clicks outside the suggestion box to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionBoxRef]);

  // Function to handle textarea resizing
  const handleTextareaResize = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto'; // Reset height to recalculate based on content
    // Set a minimum height based on initial style (e.g., py-3 maps roughly to 44px for one line)
    // Or just use scrollHeight, ensuring it doesn't shrink below 1 line visually
    const newHeight = Math.max(target.scrollHeight, 44); // Example min height
    target.style.height = `${newHeight}px`;
  };

  // Combined handler for input change and resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const query = e.target.value;
    setQuestion(query);
    handleTextareaResize(e.target); // Resize on input

    // Suggestion logic
    if (query.trim().length > 1) {
      const filteredSuggestions = savedAnswersList
        .filter((item) =>
          item.question.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Clear state and resize textarea when submitting
  const resetSearchUI = (clearQuestion: boolean = false) => {
    if (clearQuestion) {
      setQuestion(""); // Only clear question if explicitly requested
      if (textareaRef.current) {
        textareaRef.current.value = ""; // Clear textarea value directly
        handleTextareaResize(textareaRef.current); // Resize back to default
      }
    }
    // ... other state resets ...
    setLoading(false);
    setError(null);
    setAnswer(null);
    setRegularSearchResults(null);
    setSaveSuccess(false);
    setSaveError(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSuggestionClick = (id: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    // Clear the question when navigating away
    resetSearchUI(true);
    navigate(`/answer/${id}`);
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault(); // Allow calling without event (e.g., after suggestion click)
    if (!question.trim()) return;
    
    const currentQuestion = question; // Capture question before reset
    resetSearchUI(false); // Reset UI fields but keep the question
    setLoading(true); // Set loading *after* reset

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: currentQuestion, // Use captured question
          isRegularSearch: isRegularSearch
        }),
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (typeof errorData === "object" && errorData !== null) {
            errorMessage =
              (errorData as any).error ||
              (errorData as any).details ||
              errorMessage;
          }
        } catch (e) {
          // Ignore if body isn't JSON or empty
        }
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as AskApiResponse;
      if (isRegularSearch) {
        setRegularSearchResults(result.answer);
      } else {
        setAnswer(result.answer || "No answer found.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      console.error("Error fetching answer:", err);
      setAnswer(null);
      setRegularSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSearch = () => {
    setIsRegularSearch(!isRegularSearch);
    // Clear previous results when switching modes
    setAnswer(null);
    setRegularSearchResults(null);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!question || !answer) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        // Try to parse error JSON, default to status text
        let errorMessage = `Failed to save: ${response.statusText}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // JSON parsing failed or no 'error' property, stick with statusText
          console.warn("Could not parse error JSON from /api/save", e);
        }
        throw new Error(errorMessage);
      }

      // Optionally handle success response if needed
      // const result = await response.json();
      setSaveSuccess(true);
      // Trigger refresh of saved answers list after successful save
      fetchSavedAnswers();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save the answer."
      );
      console.error("Error saving answer:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnswer = async (id: string) => {
    setDeleteError(null); // Clear previous delete errors
    try {
      const response = await fetch(`/api/delete/${id}`, {
        method: "DELETE",
      });

      // Define expected response type
      type DeleteApiResponse = {
        success: boolean;
        error?: string;
        details?: string;
      };
      const result = (await response.json()) as DeleteApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.details || "Failed to delete answer"
        );
      }

      // Refresh the list after successful deletion
      fetchSavedAnswers();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while deleting.";
      setDeleteError(errorMessage);
      console.error("Error deleting answer:", err);
      // Re-throw or handle as needed, maybe show a more prominent error
      throw err; // Re-throw so the SavedAnswers component knows it failed
    }
  };

  return (
    <div className="flex h-screen">
      {/* --- Sidebar --- */}
      <div className="flex-shrink-0 w-64 md:w-72 lg:w-80 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        <SavedAnswers
          savedAnswers={savedAnswersList}
          isLoading={isSidebarLoading}
          error={sidebarError}
          refetchAnswers={fetchSavedAnswers}
          onDelete={handleDeleteAnswer}
        />
        {deleteError && (
          <div className="p-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 m-2 rounded">
            Delete Error: {deleteError}
          </div>
        )}
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {today}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="mb-8">
              <div
                ref={suggestionBoxRef}
                className="relative border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-within:ring-2 ring-orange-500 overflow-hidden"
              >
                <textarea
                  id="question-input"
                  ref={textareaRef}
                  rows={1}
                  className="w-full px-4 py-3 border-none resize-none overflow-hidden bg-transparent focus:outline-none focus:ring-0 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-slate-100 block"
                  placeholder="How can I help you today?"
                  value={question}
                  onChange={handleTextareaChange}
                  onFocus={() =>
                    question.trim().length > 1 &&
                    suggestions.length > 0 &&
                    setShowSuggestions(true)
                  }
                  onKeyDown={(e) => {
                    // Submit on Enter key press, unless Shift is held
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline
                      handleSubmit(); // Trigger form submission
                    }
                  }}
                  disabled={loading}
                  required
                  style={{ minHeight: '44px' }}
                />

                {/* Suggestions Dropdown - Placed absolutely relative to the container div */}
                {showSuggestions && suggestions.length > 0 && (
                   <ul className="absolute z-10 w-[calc(100%-1rem)] left-2 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item) => (
                      <li
                        key={item.id}
                        className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer truncate"
                        onClick={() => handleSuggestionClick(item.id)}
                        title={item.question}
                      >
                        {item.question}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Feature Bar - Now includes submit button */}
                <FeatureBar
                  isRegularSearch={isRegularSearch}
                  onToggleSearch={handleToggleSearch}
                  onSubmit={handleSubmit}
                  isLoading={loading}
                  isDisabled={loading || !question.trim()}
                />
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div
                className="mb-6 p-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Error Asking:</span> {error}
              </div>
            )}

            {/* Answer Display Card */}
            {(answer || regularSearchResults) && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden max-w-none">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100 not-prose">
                    {isRegularSearch ? 'Search Results' : 'Answer'}
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {isRegularSearch && regularSearchResults ? (
                    <RegularSearchResults results={regularSearchResults} />
                  ) : (
                    <MarkdownDisplay markdown={answer || ''} />
                  )}
                </div>
                {/* Save Section - Only show for AI search results */}
                {!isRegularSearch && answer && !regularSearchResults && (
                  <div className="not-prose border-t border-gray-200 dark:border-slate-700 px-4 py-4 sm:px-6 bg-gray-50 dark:bg-slate-800/50">
                    {saveSuccess ? (
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Answer saved successfully!
                      </p>
                    ) : (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ring-orange-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                      >
                        {isSaving ? (
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="-ml-1 mr-2 h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                          </svg>
                        )}
                        {isSaving ? "Saving..." : "Save Answer"}
                      </button>
                    )}
                    {saveError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Error saving: {saveError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
