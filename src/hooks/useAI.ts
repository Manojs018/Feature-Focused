import axios from "axios";

export function useAI(getAuthToken: () => Promise<string>) {
  const getBriefing = async (tasks: any[]) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/ai/briefing",
        { tasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.briefing;
    } catch (err) {
      console.error("Error getting AI briefing:", err);
      return "Unable to load today's briefing. Keep pushing forward and beating those deadlines!";
    }
  };

  const prioritizeTasks = async (tasks: any[]) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/ai/prioritize",
        { tasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error("Error prioritizing tasks:", err);
      return [];
    }
  };

  const chat = async (history: any[], message: string) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/ai/chat",
        { history, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data; // returns { reply, history }
    } catch (err) {
      console.error("Error in AI chat:", err);
      return {
        reply: "I'm having trouble connecting to my central cortex right now. Let's try again in a moment. What task are we working on?",
        history: [...history, { role: "user", parts: [{ text: message }] }]
      };
    }
  };

  const breakdownTask = async (task: any) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/ai/breakdown",
        { task },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data; // returns array of subtasks
    } catch (err) {
      console.error("Error breaking down task:", err);
      return [
        "Review core requirements of the task",
        "Block out 30 minutes of deep focus",
        "Draft the initial components or outline",
        "Refine and complete the task details",
        "Review and mark complete on Dashboard"
      ];
    }
  };

  const getWeeklyInsights = async (tasks: any[], habits: any[], logs: any[]) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/ai/weekly-insights",
        { tasks, habits, logs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.analysis;
    } catch (err) {
      console.error("Error getting weekly insights:", err);
      return "Insights generation failed. Make sure you complete some tasks and log your habits first so we have data to analyze!";
    }
  };

  const scheduleReminder = async (taskId: string, taskTitle: string, reminderTime: string) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "/api/reminders/schedule",
        { taskId, taskTitle, reminderTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error("Error scheduling reminder:", err);
      throw err;
    }
  };

  return {
    getBriefing,
    prioritizeTasks,
    chat,
    breakdownTask,
    getWeeklyInsights,
    scheduleReminder,
  };
}
