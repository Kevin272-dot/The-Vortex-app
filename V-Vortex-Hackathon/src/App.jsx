import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Preloader from "./components/Preloader";
import PageTransition from "./components/PageTransition";
import "./styles/dashboard.css";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import OTP from "./pages/otp";
import TeamDashboard from "./pages/dashboard";
import Member from "./pages/member";
import Admin from "./pages/admin";

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [transition, setTransition] = useState(null);

  return (
    <BrowserRouter>

      {transition}

      {!introDone ? (
        <Preloader onFinished={() => setIntroDone(true)} />
      ) : (
        <Routes>
          <Route path="/" element={<Home setTransition={setTransition} />} />
          <Route path="/login" element={<Login setTransition={setTransition} />} />
          <Route path="/register" element={<Register setTransition={setTransition} />} />
          <Route path="/otp" element={<OTP setTransition={setTransition} />} />
          <Route path="/member" element={<Member />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<TeamDashboard />} />
          <Route path="/dashboard/:teamId" element={<TeamDashboard />} />

        </Routes>
      )}

    </BrowserRouter>
  );
}
