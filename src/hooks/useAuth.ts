import { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import axios from "axios";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for cached demo user first
    const cachedMockUser = localStorage.getItem("lmls_mock_user");
    if (cachedMockUser) {
      try {
        const mockObj = JSON.parse(cachedMockUser);
        setUser(mockObj);
        setLoading(false);
        requestAndSaveFcmToken(mockObj);
        return;
      } catch (e) {
        localStorage.removeItem("lmls_mock_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userObj = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          isMock: false,
        };
        setUser(userObj);
        await requestAndSaveFcmToken(userObj);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = {
        uid: result.user.uid,
        displayName: result.user.displayName || "User",
        email: result.user.email || "",
        photoURL: result.user.photoURL || "",
        isMock: false,
      };
      setUser(userObj);
      await requestAndSaveFcmToken(userObj);
    } catch (err: any) {
      console.error("Google Auth failed (likely iframe restriction):", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithMock = (name: string, email: string) => {
    setLoading(true);
    const cleanEmail = email.trim() || "demo@example.com";
    const cleanName = name.trim() || "Last-Minute Student";
    // standard mock pattern
    const mockUid = "mock-user-" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "");
    
    const mockUserObj = {
      uid: mockUid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanUid(mockUid),
      isMock: true,
    };
    
    localStorage.setItem("lmls_mock_user", JSON.stringify(mockUserObj));
    setUser(mockUserObj);
    setLoading(false);
    requestAndSaveFcmToken(mockUserObj);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem("lmls_mock_user");
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setUser(null);
    setLoading(false);
  };

  const getAuthToken = async (): Promise<string> => {
    if (user?.isMock) {
      return user.uid;
    }
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    // Fallback if cached user exists
    const cachedMockUser = localStorage.getItem("lmls_mock_user");
    if (cachedMockUser) {
      return JSON.parse(cachedMockUser).uid;
    }
    return "";
  };

  const requestAndSaveFcmToken = async (u: any) => {
    try {
      const token = "mock-fcm-token-" + u.uid;
      const idToken = u.isMock ? u.uid : await auth.currentUser?.getIdToken();
      if (idToken) {
        await axios.post("/api/user/fcm", { token }, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
      }
    } catch (e) {
      // safe ignore
    }
  };

  function cleanUid(str: string): string {
    return str.replace("mock-user-", "");
  }

  return {
    user,
    loading,
    loginWithGoogle,
    loginWithMock,
    logout,
    getAuthToken,
  };
}
