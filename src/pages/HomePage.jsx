import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">
      <h1 className="text-4xl font-bold">P2P Video Call</h1>

      <p className="text-slate-400">
        Welcome to your video calling application.
      </p>

      <button
        onClick={() => navigate("/pre-call")}
        className="rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700"
      >
        Start a Call
      </button>
    </main>
  );
};
export default HomePage;
