import { useContext } from "react";
import { assets } from "../src/assets/assets";
import { Link } from "react-router-dom";
import { Appcontext } from "../src/context/Appcontext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, setShowLogin, logout } = useContext(Appcontext);
  const navigate = useNavigate;
  const OnclickHandler = () => {
    if (user) {
      navigate("/zoom");
    } else {
      setShowLogin(true);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-3 text-center sm:text-left">
        <Link to="/">
          <img src={assets.logo_icon} alt="" className="w-10 sm:w-12 lg:w-14" />{" "}
        </Link>

        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">
          AI EMOTION DETECTION DASHBOARD <br />
          <span className="text-xs sm:text-sm text-gray-500">
            E-learning platform Analytics & Management
          </span>
        </h1>
      </div>

      {user ? (
        <div className="flex items-center gap-3 sm:gap-6">
          <p className="text-gray-600 max-sm:hidden pl-3">{user.name}</p>
          <div className="relative group">
            <img
              src={assets.profile_icon}
              alt=""
              className="w-8 drop-shadow sm:w-10 mt-2"
            />
            <div className="absolute hidden group-hover:block right-0 top-0 z-10 text-black rounded pt-12">
              <ul className="list-none bg-white p-2 rounded text-sm shadow-md border-none">
                <li
                  onClick={logout}
                  className="px-2 py-1 cursor-pointer pr-10 hover:text-red-800"
                >
                  Logout
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={OnclickHandler}
          className="bg-zinc-800 text-white py-2 px-7 sm:px-10 text-sm rounded-full"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Navbar;
