import { useEffect, useMemo, useState } from "react";
import API from "./api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    monthlyBudget: 5000,
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    monthlyBudget: 5000,
  });

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
  });

  const [goalForm, setGoalForm] = useState({
    title: "",
    targetAmount: "",
    savedAmount: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        monthlyBudget: user.monthlyBudget || 5000,
      });
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };

  const handleGoalChange = (e) => {
    setGoalForm({ ...goalForm, [e.target.name]: e.target.value });
  };

  const fetchExpenses = async () => {
    try {
      const res = await API.get("/expenses");
      setExpenses(res.data || []);
    } catch (error) {
      console.log("Expense fetch error:", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await API.get("/goals");
      setGoals(res.data || []);
    } catch (error) {
      console.log("Goal fetch error:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchGoals();
    }
  }, [user]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/signup", {
        ...authForm,
        monthlyBudget: Number(authForm.monthlyBudget),
      });

      alert("Signup successful. Please login.");
      setIsLogin(true);
      setAuthForm({
        name: "",
        email: "",
        password: "",
        monthlyBudget: 5000,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: authForm.email,
        password: authForm.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);

      setAuthForm({
        name: "",
        email: "",
        password: "",
        monthlyBudget: 5000,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: profileForm.name,
        monthlyBudget: Number(profileForm.monthlyBudget),
      };

      // Change this endpoint if your backend uses another route
      const res = await API.put("/auth/profile", payload);

      const updatedUser = res.data.user || {
        ...user,
        ...payload,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("Profile updated successfully");
    } catch (error) {
      // fallback so UI still works even if backend route not added yet
      const updatedUser = {
        ...user,
        name: profileForm.name,
        monthlyBudget: Number(profileForm.monthlyBudget),
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert(
        "Profile updated in frontend/localStorage. Add backend PUT /auth/profile to save permanently in database."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setExpenses([]);
    setGoals([]);
    setActiveTab("dashboard");
  };

  const addExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/expenses", {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });

      setExpenseForm({
        title: "",
        amount: "",
        category: "Food",
        date: "",
      });

      await fetchExpenses();
      setActiveTab("expenses");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await API.delete(`/expenses/${id}`);
      await fetchExpenses();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/goals", {
        ...goalForm,
        targetAmount: Number(goalForm.targetAmount),
        savedAmount: Number(goalForm.savedAmount || 0),
      });

      setGoalForm({
        title: "",
        targetAmount: "",
        savedAmount: "",
      });

      await fetchGoals();
    } catch (error) {
      alert("Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  const updateGoalSavedAmount = async (id, currentSavedAmount) => {
    const value = prompt("Enter updated saved amount", currentSavedAmount);
    if (value === null) return;

    try {
      await API.put(`/goals/${id}`, {
        savedAmount: Number(value),
      });
      await fetchGoals();
    } catch (error) {
      alert("Failed to update goal");
    }
  };

  const budget = Number(user?.monthlyBudget || 5000);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => {
    return budget - totalExpense;
  }, [budget, totalExpense]);

  const budgetUsedPercent = useMemo(() => {
    if (budget <= 0) return 0;
    return Math.round((totalExpense / budget) * 100);
  }, [budget, totalExpense]);

  const avgExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalExpense / expenses.length);
  }, [expenses, totalExpense]);

  const categoryTotals = useMemo(() => {
    const result = {};
    expenses.forEach((item) => {
      const category = item.category || "Other";
      result[category] = (result[category] || 0) + Number(item.amount);
    });
    return result;
  }, [expenses]);

  const highestCategory = useMemo(() => {
    let maxCategory = "None";
    let maxAmount = 0;

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxCategory = category;
        maxAmount = amount;
      }
    });

    return { maxCategory, maxAmount };
  }, [categoryTotals]);

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Expense by Category",
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#7c3aed",
          "#0ea5e9",
          "#22c55e",
          "#f59e0b",
          "#ef4444",
          "#14b8a6",
          "#64748b",
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyMap = useMemo(() => {
    const map = {};
    expenses.forEach((item) => {
      const dateObj = new Date(item.date || item.createdAt);
      const month = dateObj.toLocaleString("default", { month: "short" });
      map[month] = (map[month] || 0) + Number(item.amount);
    });
    return map;
  }, [expenses]);

  const barData = {
    labels: Object.keys(monthlyMap),
    datasets: [
      {
        label: "Monthly Spend",
        data: Object.values(monthlyMap),
        backgroundColor: "#7c3aed",
        borderRadius: 8,
      },
    ],
  };

  const predictedMonthExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalExpense * 1.2);
  }, [totalExpense, expenses.length]);

  const spendingRatio = budget > 0 ? totalExpense / budget : 0;

  const wellnessScore = useMemo(() => {
    let score = 100;

    if (spendingRatio > 1) score -= 30;
    else if (spendingRatio > 0.85) score -= 18;
    else if (spendingRatio > 0.7) score -= 10;

    if ((categoryTotals.Shopping || 0) > budget * 0.25) score -= 12;
    if ((categoryTotals.Food || 0) > budget * 0.35) score -= 8;
    if (goals.length > 0) score += 5;

    score = Math.max(0, Math.min(100, score));
    return score;
  }, [spendingRatio, categoryTotals, budget, goals.length]);

  const financialPersonality = useMemo(() => {
    const food = categoryTotals.Food || 0;
    const shopping = categoryTotals.Shopping || 0;
    const travel = categoryTotals.Travel || 0;

    if (expenses.length === 0) {
      return {
        type: "No Profile Yet",
        note: "Add expenses to generate a behavior profile.",
      };
    }

    if (shopping > budget * 0.22 && totalExpense > budget * 0.9) {
      return {
        type: "Impulse Spender",
        note: "Your pattern shows higher discretionary spending with low control.",
      };
    }

    if (food > budget * 0.3 && totalExpense > budget * 0.75) {
      return {
        type: "Comfort Spender",
        note: "Food and lifestyle-related spending is taking a large share.",
      };
    }

    if (travel > budget * 0.25) {
      return {
        type: "Active Mover",
        note: "Travel-related expenses dominate your spending behavior.",
      };
    }

    if (totalExpense <= budget * 0.7 && goals.length > 0) {
      return {
        type: "Planned Saver",
        note: "You maintain better discipline and align spending with goals.",
      };
    }

    if (totalExpense <= budget) {
      return {
        type: "Balanced Controller",
        note: "Your expense pattern is mostly stable and within budget.",
      };
    }

    return {
      type: "Risk-Prone User",
      note: "Your spending pattern indicates possible financial drift.",
    };
  }, [categoryTotals, totalExpense, budget, goals.length, expenses.length]);

  const expenseDNA = useMemo(() => {
    const frequency =
      expenses.length >= 12
        ? "High Frequency"
        : expenses.length >= 6
        ? "Medium Frequency"
        : "Low Frequency";

    const control =
      totalExpense <= budget * 0.7
        ? "Strong Control"
        : totalExpense <= budget
        ? "Moderate Control"
        : "Weak Control";

    const savingsFocus = goals.length > 0 ? "Goal Oriented" : "Low Savings Focus";

    const riskLevel =
      predictedMonthExpense > budget
        ? "High Risk"
        : totalExpense > budget * 0.8
        ? "Medium Risk"
        : "Low Risk";

    return `${highestCategory.maxCategory} Dominant | ${frequency} | ${control} | ${savingsFocus} | ${riskLevel}`;
  }, [expenses.length, totalExpense, budget, goals.length, predictedMonthExpense, highestCategory.maxCategory]);

  const silentRisk = useMemo(() => {
    const lowValueEntries = expenses.filter((item) => Number(item.amount) <= 200);
    const lowValueTotal = lowValueEntries.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    if (lowValueEntries.length >= 5 && lowValueTotal > budget * 0.15) {
      return {
        level: "High",
        note: `Repeated low-value transactions are causing hidden leakage of ₹${lowValueTotal}.`,
      };
    }

    if (lowValueEntries.length >= 3) {
      return {
        level: "Moderate",
        note: "Small repeated expenses are slowly building into a visible loss.",
      };
    }

    return {
      level: "Low",
      note: "No significant micro-leakage detected.",
    };
  }, [expenses, budget]);

  const regretCost = useMemo(() => {
    const shopping = categoryTotals.Shopping || 0;
    const food = categoryTotals.Food || 0;
    const avoidable = Math.round(shopping * 0.5 + food * 0.2);

    return {
      monthly: avoidable,
      yearly: avoidable * 12,
    };
  }, [categoryTotals]);

  const goalDelayData = useMemo(() => {
    if (goals.length === 0) {
      return {
        title: "No Goal Available",
        note: "Create a goal to measure how current spending affects completion time.",
      };
    }

    const mainGoal = goals[0];
    const target = Number(mainGoal.targetAmount || 0);
    const saved = Number(mainGoal.savedAmount || 0);
    const remaining = Math.max(0, target - saved);

    let monthlyPossibleSaving = Math.max(500, budget - totalExpense);
    if (monthlyPossibleSaving <= 0) monthlyPossibleSaving = 300;

    const monthsNeeded = Math.ceil(remaining / monthlyPossibleSaving);
    const delayedMonths =
      totalExpense > budget
        ? monthsNeeded + 2
        : totalExpense > budget * 0.85
        ? monthsNeeded + 1
        : monthsNeeded;

    return {
      title: mainGoal.title,
      note: `At the current pace, this goal may require approximately ${delayedMonths} month(s) to complete.`,
    };
  }, [goals, budget, totalExpense]);

  const monthlyStory = useMemo(() => {
    if (expenses.length === 0) {
      return "No financial activity available yet. Add expense data to generate a monthly summary.";
    }

    if (totalExpense > budget) {
      return `Spending has crossed the budget threshold. ${highestCategory.maxCategory} is the dominant category, and current expense behavior requires corrective planning.`;
    }

    if (goals.length > 0 && totalExpense <= budget * 0.8) {
      return "This month reflects disciplined spending behavior. Expenses remain within a safer range, and savings goals are better supported.";
    }

    return `${highestCategory.maxCategory} remains the strongest expense category. Overall activity is manageable, but controlled adjustments can improve future savings performance.`;
  }, [expenses.length, totalExpense, budget, highestCategory.maxCategory, goals.length]);

  const smartSuggestions = useMemo(() => {
    const suggestions = [];

    if (totalExpense > budget) {
      suggestions.push("Budget exceeded. Reduce non-essential spending immediately.");
    }

    if (predictedMonthExpense > budget) {
      suggestions.push("Projected month-end spend is above the planned budget.");
    }

    if ((categoryTotals.Food || 0) > totalExpense * 0.35) {
      suggestions.push("Food expenses are comparatively high. Consider reducing outside purchases.");
    }

    if ((categoryTotals.Shopping || 0) > totalExpense * 0.22) {
      suggestions.push("Shopping is consuming a significant portion of the budget.");
    }

    if (goals.length === 0) {
      suggestions.push("Add a savings goal to improve financial direction and discipline.");
    }

    if (silentRisk.level === "High") {
      suggestions.push("Micro-leakage detected. Small repeated expenses need tighter control.");
    }

    if (regretCost.monthly > 0) {
      suggestions.push(`Potential recoverable monthly savings: ₹${regretCost.monthly}.`);
    }

    if (suggestions.length === 0) {
      suggestions.push("Spending pattern is stable. Continue maintaining the current control level.");
    }

    return suggestions;
  }, [totalExpense, budget, predictedMonthExpense, categoryTotals, goals.length, silentRisk.level, regretCost.monthly]);

  const recentExpenses = useMemo(() => {
    return [...expenses].slice(0, 5);
  }, [expenses]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((item) => {
      const d = new Date(item.date || item.createdAt);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [expenses]);

  const downloadCSV = (rows, fileName) => {
    if (!rows || rows.length === 0) {
      alert("No expense data available to export");
      return;
    }

    const headers = ["Title", "Amount", "Category", "Date"];
    const csvRows = rows.map((item) => [
      `"${item.title || ""}"`,
      Number(item.amount || 0),
      `"${item.category || "Other"}"`,
      `"${new Date(item.date || item.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = [headers, ...csvRows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllExpenses = () => {
    downloadCSV(expenses, "all-expenses.csv");
  };

  const exportCurrentMonthExpenses = () => {
    downloadCSV(currentMonthExpenses, "current-month-expenses.csv");
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-top">
            <h1>Trackify X</h1>
            <p>Intelligent Financial Behaviour Monitoring System</p>
          </div>

          <div className="auth-tabs">
            <button
              className={isLogin ? "auth-tab active-auth-tab" : "auth-tab"}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={!isLogin ? "auth-tab active-auth-tab" : "auth-tab"}
              onClick={() => setIsLogin(false)}
            >
              Signup
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="auth-form">
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={handleAuthChange}
                  required
                />
                <input
                  type="number"
                  name="monthlyBudget"
                  placeholder="Monthly Budget"
                  value={authForm.monthlyBudget}
                  onChange={handleAuthChange}
                  required
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={authForm.email}
              onChange={handleAuthChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthChange}
              required
            />

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Trackify X</h1>
          <p>Intelligent Financial Behaviour Analytics Dashboard</p>
        </div>

        <div className="topbar-right">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="budget-box">
            <span>Monthly Budget</span>
            <strong>₹{budget}</strong>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={activeTab === "dashboard" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "add" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("add")}
        >
          Add Expense
        </button>
        <button
          className={activeTab === "expenses" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("expenses")}
        >
          Expenses
        </button>
        <button
          className={activeTab === "goals" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("goals")}
        >
          Goals
        </button>
        <button
          className={activeTab === "profile" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={activeTab === "lab" ? "nav-btn active-nav-btn" : "nav-btn"}
          onClick={() => setActiveTab("lab")}
        >
          Intelligence Lab
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <>
          <section className="stats-grid">
            <div className="card stat-card">
              <span>Total Expense</span>
              <h2>₹{totalExpense}</h2>
              <p>{expenses.length} transactions</p>
            </div>

            <div className="card stat-card">
              <span>Remaining Budget</span>
              <h2 className={remainingBudget < 0 ? "danger-text" : "success-text"}>
                ₹{remainingBudget}
              </h2>
              <p>{remainingBudget < 0 ? "Budget exceeded" : "Budget available"}</p>
            </div>

            <div className="card stat-card">
              <span>Budget Usage</span>
              <h2>{budgetUsedPercent}%</h2>
              <p>Used from monthly budget</p>
            </div>

            <div className="card stat-card">
              <span>Wellness Score</span>
              <h2>{wellnessScore}/100</h2>
              <p>Financial health indicator</p>
            </div>

            <div className="card stat-card">
              <span>Prediction</span>
              <h2>₹{predictedMonthExpense}</h2>
              <p>Estimated month-end spend</p>
            </div>

            <div className="card stat-card">
              <span>Average Expense</span>
              <h2>₹{avgExpense}</h2>
              <p>Per transaction average</p>
            </div>
          </section>

          <section className="progress-section">
            <div className="card">
              <div className="section-head">
                <h3>Budget Consumption</h3>
              </div>

              <div className="progress-track large-progress">
                <div
                  className={`progress-fill ${budgetUsedPercent > 100 ? "danger-fill" : ""}`}
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                ></div>
              </div>

              <p className="progress-label">
                {budgetUsedPercent > 100
                  ? `Budget exceeded by ${budgetUsedPercent - 100}%`
                  : `${budgetUsedPercent}% of budget used`}
              </p>
            </div>
          </section>

          <section className="summary-grid">
            <div className="card summary-card">
              <h3>Behavior Profile</h3>
              <strong>{financialPersonality.type}</strong>
              <p>{financialPersonality.note}</p>
            </div>

            <div className="card summary-card">
              <h3>Expense DNA</h3>
              <strong>{expenseDNA}</strong>
            </div>

            <div className="card summary-card">
              <h3>Silent Risk</h3>
              <strong>{silentRisk.level}</strong>
              <p>{silentRisk.note}</p>
            </div>
          </section>

          <section className="charts-grid">
            <div className="card chart-card">
              <div className="section-head">
                <h3>Expense by Category</h3>
              </div>
              {expenses.length > 0 ? <Pie data={pieData} /> : <p>No expense data available.</p>}
            </div>

            <div className="card chart-card">
              <div className="section-head">
                <h3>Monthly Spend Trend</h3>
              </div>
              {expenses.length > 0 ? <Bar data={barData} /> : <p>No monthly trend available.</p>}
            </div>
          </section>

          <section className="info-grid">
            <div className="card">
              <div className="section-head">
                <h3>Monthly Financial Summary</h3>
              </div>
              <p className="long-text">{monthlyStory}</p>
            </div>

            <div className="card">
              <div className="section-head">
                <h3>Adaptive Recommendations</h3>
              </div>
              <ul className="list">
                {smartSuggestions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="single-grid">
            <div className="card form-card">
              <div className="section-head">
                <h3>Quick Export</h3>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="primary-btn" onClick={exportAllExpenses}>
                  Export All Expenses
                </button>
                <button className="secondary-btn" onClick={exportCurrentMonthExpenses}>
                  Export This Month
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "add" && (
        <section className="single-grid">
          <div className="card form-card">
            <div className="section-head">
              <h3>Add New Expense</h3>
            </div>

            <form onSubmit={addExpense} className="main-form">
              <input
                type="text"
                name="title"
                placeholder="Expense Title"
                value={expenseForm.title}
                onChange={handleExpenseChange}
                required
              />

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                required
              />

              <select
                name="category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
              >
                <option>Food</option>
                <option>Travel</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Health</option>
                <option>Education</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                name="date"
                value={expenseForm.date}
                onChange={handleExpenseChange}
                required
              />

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </div>
        </section>
      )}

      {activeTab === "expenses" && (
        <section className="single-grid">
          <div className="card">
            <div className="section-head" style={{ justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <h3>Expense History</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button className="primary-btn" onClick={exportAllExpenses}>
                  Export All
                </button>
                <button className="secondary-btn" onClick={exportCurrentMonthExpenses}>
                  Export This Month
                </button>
              </div>
            </div>

            {expenses.length === 0 ? (
              <p>No expenses added yet.</p>
            ) : (
              <div className="expense-list">
                {expenses.map((item) => (
                  <div className="expense-row" key={item._id}>
                    <div className="expense-left">
                      <h4>{item.title}</h4>
                      <p>
                        {item.category} |{" "}
                        {new Date(item.date || item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="expense-right">
                      <strong>₹{item.amount}</strong>
                      <button
                        className="danger-btn"
                        onClick={() => deleteExpense(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "goals" && (
        <section className="info-grid">
          <div className="card form-card">
            <div className="section-head">
              <h3>Create Goal</h3>
            </div>

            <form onSubmit={addGoal} className="main-form">
              <input
                type="text"
                name="title"
                placeholder="Goal Title"
                value={goalForm.title}
                onChange={handleGoalChange}
                required
              />

              <input
                type="number"
                name="targetAmount"
                placeholder="Target Amount"
                value={goalForm.targetAmount}
                onChange={handleGoalChange}
                required
              />

              <input
                type="number"
                name="savedAmount"
                placeholder="Saved Amount"
                value={goalForm.savedAmount}
                onChange={handleGoalChange}
              />

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Goal"}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="section-head">
              <h3>Goal Tracking</h3>
            </div>

            {goals.length === 0 ? (
              <p>No goals available.</p>
            ) : (
              <div className="goal-list">
                {goals.map((goal) => {
                  const progress = Math.min(
                    100,
                    Math.round(
                      (Number(goal.savedAmount || 0) / Number(goal.targetAmount || 1)) * 100
                    )
                  );

                  return (
                    <div className="goal-row" key={goal._id}>
                      <div className="goal-top">
                        <h4>{goal.title}</h4>
                        <span>{progress}%</span>
                      </div>

                      <p>Target: ₹{goal.targetAmount}</p>
                      <p>Saved: ₹{goal.savedAmount}</p>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <button
                        className="secondary-btn"
                        onClick={() =>
                          updateGoalSavedAmount(goal._id, goal.savedAmount)
                        }
                      >
                        Update Savings
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "profile" && (
        <section className="single-grid">
          <div className="card form-card">
            <div className="section-head">
              <h3>Update Profile</h3>
            </div>

            <form onSubmit={handleProfileUpdate} className="main-form">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />

              <input
                type="email"
                name="email"
                value={profileForm.email}
                disabled
              />

              <input
                type="number"
                name="monthlyBudget"
                placeholder="Monthly Budget"
                value={profileForm.monthlyBudget}
                onChange={handleProfileChange}
                required
              />

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>
        </section>
      )}

      {activeTab === "lab" && (
        <section className="lab-grid">
          <div className="card lab-card">
            <h3>Financial Personality Engine</h3>
            <strong>{financialPersonality.type}</strong>
            <p>{financialPersonality.note}</p>
          </div>

          <div className="card lab-card">
            <h3>Expense DNA Profile</h3>
            <strong>{expenseDNA}</strong>
            <p>Compact summary of behavioral spending characteristics.</p>
          </div>

          <div className="card lab-card">
            <h3>Silent Risk Detector</h3>
            <strong>{silentRisk.level} Risk</strong>
            <p>{silentRisk.note}</p>
          </div>

          <div className="card lab-card">
            <h3>Regret Cost Analyzer</h3>
            <strong>₹{regretCost.monthly} / month</strong>
            <p>Estimated yearly recoverable value: ₹{regretCost.yearly}</p>
          </div>

          <div className="card lab-card">
            <h3>Goal Delay Predictor</h3>
            <strong>{goalDelayData.title}</strong>
            <p>{goalDelayData.note}</p>
          </div>

          <div className="card lab-card">
            <h3>Recent Activity Snapshot</h3>
            {recentExpenses.length === 0 ? (
              <p>No recent activity available.</p>
            ) : (
              <div className="mini-list">
                {recentExpenses.map((item) => (
                  <div key={item._id} className="mini-row">
                    <span>{item.title}</span>
                    <strong>₹{item.amount}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;