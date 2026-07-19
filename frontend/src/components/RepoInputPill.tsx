import { useState } from "react";

const isValidRepoFormat = (input: string) => {
  // Branch 1: owner/repo
  // Branch 2: https://github.com/owner/repo.git
  const regex =
    /^(?:[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+|https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.git)$/;

  return regex.test(input.trim());
};

export const RepoInputPill = ({
  onConfirm,
}: {
  onConfirm: (repo: string) => void;
}) => {
  const [input, setInput] = useState("");

  const isValid = isValidRepoFormat(input);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      let sanitizedRepo = input.trim();

      // If the input is the full URL, strip the prefix and suffix
      if (sanitizedRepo.startsWith("https://github.com/")) {
        sanitizedRepo = sanitizedRepo
          .replace("https://github.com/", "")
          .replace(".git", "");
      }

      // Send only the clean "owner/repo" string to the backend
      onConfirm(sanitizedRepo);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full relative flex items-center mb-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="owner/repo or https://github.com/..."
          className="w-full bg-canvas text-ink font-mono text-base rounded-full border border-hairline px-5 h-12 outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={!isValid}
          className="absolute right-2 bg-ink text-on-dark font-sans font-medium text-sm rounded-full px-4 h-8 disabled:bg-surface-soft disabled:text-mute transition-colors"
        >
          Confirm
        </button>
      </form>
    </div>
  );
};
