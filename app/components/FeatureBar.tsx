import React from 'react';

interface FeatureBarProps {
  isRegularSearch: boolean;
  onToggleSearch: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export const FeatureBar: React.FC<FeatureBarProps> = ({ 
  isRegularSearch, 
  onToggleSearch,
  onSubmit,
  isLoading,
  isDisabled
}) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    onToggleSearch();
  };

  const buttonBaseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm focus:outline-none active:scale-[0.97] active:duration-150";

  return (
    <div className="w-full px-4 py-2 border-t border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggleClick}
          className={`${buttonBaseClasses} ${
            isRegularSearch
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
          title="Toggle between AI Search and Regular Search"
        >
          <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5099 18.0663L12.8749 11.125C13.9097 9.70609 14.3614 7.94462 14.1373 6.20283C13.9131 4.46104 13.0301 2.87135 11.6698 1.76067C10.3094 0.649994 8.57525 0.102757 6.82382 0.231501C5.0724 0.360245 3.43687 1.15518 2.25359 2.45284C1.0703 3.75049 0.429208 5.45222 0.462147 7.20806C0.495086 8.9639 1.19955 10.6404 2.43067 11.8927C3.6618 13.1451 5.32599 13.8781 7.08101 13.9411C8.83603 14.0041 10.5485 13.3922 11.8662 12.2313L19.4974 19.1725L20.5099 18.0663ZM7.34743 12.4413C6.29043 12.4413 5.25714 12.128 4.37808 11.5411C3.49902 10.9541 2.81361 10.1199 2.40843 9.14361C2.00326 8.16736 1.89648 7.09292 2.10161 6.05602C2.30673 5.01912 2.81454 4.06626 3.5609 3.31781C4.30726 2.56935 5.25869 2.05887 6.29502 1.85085C7.33134 1.64282 8.40607 1.74658 9.38345 2.14903C10.3608 2.55147 11.197 3.23453 11.7864 4.11195C12.3758 4.98937 12.692 6.02177 12.6949 7.07876C12.6929 8.4964 12.1289 9.8554 11.1265 10.8578C10.1241 11.8602 8.76506 12.4243 7.34743 12.4263V12.4413Z" fill="currentColor"/>
          </svg>
          <span>Regular Search</span>
        </button>

        <button
          type="submit"
          onClick={onSubmit}
          disabled={isDisabled}
          className={`${buttonBaseClasses} bg-orange-500 text-white hover:opacity-80 shadow-sm flex items-center space-x-2 min-w-[100px] justify-center`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <span>Submit</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}; 