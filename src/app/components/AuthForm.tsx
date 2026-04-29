"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import {Bugs} from "@/app/lib/bugs";
import {useBugStatus} from "@/app/context/BugStatusContext";

interface AuthFormProps {
  type: "login" | "register";
}

export default function AuthForm({ type }: AuthFormProps) {
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string;
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const isRegisterEmailValidationBugFixed = getContextBugStatus(Bugs.MISSING_EMAIL_VALIDATION.id);
  const isLoginEmailValidationBugFixed = getContextBugStatus(Bugs.NON_VALID_MAIL_USER_CANNOT_LOGIN.id);
  const isRegisterTypoFixed = getContextBugStatus(Bugs.TYPO_ON_LOGIN_PAGE.id);
  const isLoginPasswordFieldBugFixed = getContextBugStatus(Bugs.PASSWORD_IS_VISIBLE.id);
  const registerEmailInputType = isRegisterEmailValidationBugFixed ? "email" : "text";
  const loginEmailInputType = isLoginEmailValidationBugFixed ? "text" : "email";
  const loginPasswordInputType = isLoginPasswordFieldBugFixed ? "password" : "text";

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(`/${student}/dashboard`);
    }
  }, [isAuthLoading, isAuthenticated, router, student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = type === "login" ? `/${student}/api/auth/login` : `/${student}/api/auth/register`;
      const payload =
        type === "login"
          ? { email: formData.email, password: formData.password }
          : formData;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const { token } = await res.json();

        if (token) {
          // Use the login function from AuthContext instead of handling it here
          login(token);
        } else {
          setError("Nevalidní odpověď ze serveru. Prosím zkuste přihlášení znovu.");
        }
      } else {
        setError("Neplatné přihlašovací údaje. Prosím zkuste přihlášení znovu.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message); // Set error message
      } else {
        setError("Něco se nepovedlo. Zkus to znovu prosím.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p data-test-id="auth-loading">Načítání...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 bg-gray-100 rounded-lg shadow-md w-full">
      {/* Logo section */}
      <div className="p-8 flex items-center justify-center">
        <Image src="/czechigram-logo.png" alt="CzechiGram" width={250} height={150} data-test-id="logo" />
      </div>

      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-pink-600 to-pink-300">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">
            {type === "login" ? "Přihlášení" : "Registrace"}
          </h2>
          {error && (
            <p className="text-red-500 bg-gray-100 text-sm text-center rounded mb-4 p-2" data-test-id="auth-error">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "register" && (
              <input
                type="text"
                name="name"
                placeholder="Uživatelské jméno"
                className="text-black w-full p-2 border rounded"
                onChange={handleChange}
                data-test-id="name-field"
                disabled={isSubmitting}
                required
              />
            )}
            <input
              type={type === "register" ? registerEmailInputType : loginEmailInputType}
              name="email"
              placeholder="E-mail"
              className="text-black w-full p-2 border rounded"
              onChange={handleChange}
              data-test-id="email-field"
              disabled={isSubmitting}
              required
            />
            <input
              type={type === "register" ? "password" : loginPasswordInputType}
              name="password"
              placeholder="Heslo"
              className="text-black w-full p-2 border rounded"
              onChange={handleChange}
              data-test-id="password-field"
              disabled={isSubmitting}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
              data-test-id={type === "login" ? "login-submit-button" : "register-submit-button"}
            >
              {isSubmitting
                ? "Načítání..."
                : type === "login"
                  ? "Přihlásit se"
                  : "Registrovat"}
            </button>
          </form>
          {type === "register" ? (
            <div className="mt-4 text-center">
              Už máš účet? <Link href={`/${student}/login`} className="text-blue-600 hover:underline" data-test-id="switch-to-login">Přihlas se</Link>
            </div>
          ) : (
            <div className="mt-4 text-center">
              Ještě nemáš účet? <Link href={`/${student}/register`} className="text-blue-600 hover:underline" data-test-id="switch-to-register">{isRegisterTypoFixed ? "Zaregistruj se" : "Zregistrj se"}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
