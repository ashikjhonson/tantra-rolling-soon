import React from "react";
import b1 from "../../assets/rsc/Border1.png";
import b2 from "../../assets/rsc/Border2.png";
import b3 from "../../assets/rsc/Border3.png";
import "./Poster.css"; 
function Poster() {
  return (
    <div className="flex justify-center items-center h-64 w-64 bg-gray-200 landing_view">
      <div className="crt h-96 w-[500px] flex justify-center items-center scale-125">
        <div className="relative w-64 h-24">
          <img
            src={b3}
            className="absolute top-0 left-0 w-full h-full transform translate-x-2 translate-y-2 blur-xs opacity-70 z-10 animate-scale-back"
            alt="Title Image 1"
          />
          <img
            src={b2}
            className="absolute top-0 left-0 w-full h-full transform translate-x-1 translate-y-1 blur-xs opacity-85 z-20 animate-scale-middle"
            alt="Title Image 2"
          />
          <img
            src={b1}
            className="absolute top-0 left-0 w-full h-full z-30 animate-scale-front"
            alt="Title Image 3"
          />
        </div>
      </div>
    </div>
  );
}

export default Poster;