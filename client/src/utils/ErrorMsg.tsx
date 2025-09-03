import React from 'react';
import { GoAlertFill } from "react-icons/go";

// Define the props for the component using an interface or type.
interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <p className="flex flex-center text-red-600 text-xs mt-1 font-medium gap-1">
      <GoAlertFill className="text-lg" />
      {message}
    </p>
  );
};

export default ErrorMessage;