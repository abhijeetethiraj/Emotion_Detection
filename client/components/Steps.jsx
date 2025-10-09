import { stepsData } from "../src/assets/assets";

const Steps = () => {
  return (
    <div className="flex flex-col justify-center items-center my-10 px-4">
      <h1 className="text-3xl sm:text-4xl font-semibold mb-6">How it works</h1>

      <div className="space-y-4 w-full max-w-3xl text-sm">
        {stepsData.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 sm:p-6 bg-white/20 shadow-md cursor-pointer hover:scale-105 transition-all duration-300 rounded-lg"
          >
            <img src={item.icon} alt="" width={40} className="flex-shrink-0" />
            <div>
              <h2 className="text-xl font-medium">{item.title}</h2>
              <p className="text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Steps;
