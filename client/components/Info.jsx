import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { assets } from "../src/assets/assets";
import { useContext } from "react";
import { Appcontext } from "../src/context/Appcontext";
import { useNavigate } from "react-router-dom";
const Info = () => {
  const { user, setShowLogin } = useContext(Appcontext);

  const navigate = useNavigate;

  const OnclickHandler = () => {
    if (user) {
      navigate("/zoom");
    } else {
      setShowLogin(true);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-center items-center text-center px-4 py-20">
        {/* Heading */}

        <h1 className="text-4xl sm:text-7xl max-w-[300px] sm:max-w-[590px] mx-auto mt-5 leading-tight">
          Be Present. Be <span className="text-blue-600">Brilliant</span>
        </h1>

        {/* Subheading */}
        <h2 className="max-w-xl mt-6 text-gray-600 text-base sm:text-lg">
          Enhance e-learning with AI-driven face recognition to track presence,
          improve interaction, and support real-time student analytics.
        </h2>
        <button
          onClick={OnclickHandler}
          className="sm:text-lg text-white bg-black w-auto mt-8 px-12 py-2.5 flex items-center gap-2 rounded-full "
        >
          Get Started Now
          <img src={assets.star_group} alt="" className="h-6" />
        </button>

        {/* Animation */}
        <div className="w-[250px] sm:w-[400px] md:w-[500px] lg:w-[600px] mt-10">
          <DotLottieReact
            src="https://lottie.host/adc09d15-c095-4956-adb1-c5bc523bae77/jzzD3e26nU.lottie"
            loop
            autoplay
          />
        </div>
        <h1 class="text-3xl sm:text-6xl font-bold text-transparent pb-3 bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 ">
          Make learning emotionally intelligent.
        </h1>
      </div>
    </div>
  );
};

export default Info;
