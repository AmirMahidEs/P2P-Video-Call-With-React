import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 text-white">
      <h1 className="text-6xl font-bold">404</h1>

      <p className="text-slate-400">Page Not Found</p>

      <button
        onClick={() => navigate("/")}
        className="rounded-lg bg-blue-600 px-6 py-3"
      >
        Back to Home
      </button>
    </main>
  );
};

export default NotFoundPage;
