import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useContext, useEffect } from "react";
import { Appcontext } from "../context/Appcontext";
import { useNavigate } from "react-router-dom";

const PlusIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);
const JoinIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
    />
  </svg>
);
const CalendarIcon = () => (
  <svg
    className="w-5 h-5 mr-2 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    className="w-5 h-5 mr-2 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const ChartBarIcon = () => (
  <svg
    className="w-5 h-5 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// --- Static Data for the UI ---
const upcomingMeetings = [
  {
    title: "Data Structure and Alogrithms",
    date: "October 20, 2025",
    time: "3:00 PM - 4:00 PM",
  },
  {
    title: "Advanced Machine Learning ",
    date: "October 25, 2025",
    time: "10:00 AM - 10:30 AM",
  },
  {
    title: "Linux",
    date: "October 7, 2025",
    time: "2:00 PM - 3 PM",
  },
];

const ZoomClone = () => {
  const { user, setShowLogin } = useContext(Appcontext);

  const navigate = useNavigate();

  const clickHandler = () => {
    if (!user) {
      navigate("/");
      setShowLogin(true);
    } else {
      navigate("/video");
    }
  };

  useEffect(() => {
    if (!user) navigate("/");
  }, [user]);

  if (!user) return null;

  // IMPROVEMENT: Get today's date to make the UI dynamic
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div>
      <div className="bg-white">
        <div className="flex flex-col justify-center items-center px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 items-center max-w-7xl w-full">
            {/* Text content */}
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight ">
                Transform Your Classroom with{" "}
                <span className="text-blue-600">AI Insights</span>
              </h1>
              <p className="max-w-xl mx-auto sm:mx-0 mt-6 text-gray-600 text-lg">
                Understand student engagement and emotional well-being like
                never before to foster a more supportive and effective learning
                environment.
              </p>
            </div>

            {/* Animation */}
            <div className="w-full max-w-md mx-auto sm:max-w-none">
              <DotLottieReact
                src="https://lottie.host/a891ca07-c836-479d-86e4-89a1e5b6908f/Bt3nHAWopt.lottie"
                loop
                autoplay
              />
            </div>
          </div>
        </div>
      </div>

      {/* dasboard */}

      <main className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          {/* --- Header --- */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name}!
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Ready to start your day?
              </p>
            </div>
            <button
              onClick={() => navigate("/emotion")}
              className="mt-4 sm:mt-0 flex items-center justify-center px-5 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
            >
              <ChartBarIcon />
              View Analytics
            </button>
          </div>

          {/* --- Primary Action Cards --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Card 1: New Meeting */}
            <button
              onClick={clickHandler}
              className="group w-full text-left bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                  <PlusIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    New Meeting
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Schedule a new session for your class.
                  </p>
                </div>
              </div>
            </button>
            {/* Card 2: Join Meeting */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-green-100 text-green-600 rounded-lg p-3">
                  <JoinIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Join Meeting
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Enter a meeting ID or link to join.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  placeholder="Enter Meeting ID or Link"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  onClick={clickHandler}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* --- Upcoming Meetings List --- */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Upcoming Meetings
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <ul className="divide-y divide-gray-200">
                {upcomingMeetings.map((meeting, index) => (
                  <li
                    key={index}
                    className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {meeting.title}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                        <span className="flex items-center">
                          <CalendarIcon /> {meeting.date}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon /> {meeting.time}
                        </span>
                      </div>
                    </div>
                    <button className="mt-4 sm:mt-0 w-full sm:w-auto px-5 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150">
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ZoomClone;
