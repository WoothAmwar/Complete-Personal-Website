import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

import OrderByTime from "../components/UploadOrder";




export default function Test() {
  
  return (
    <main className="flex flex-col items-center">
      <h2 className="text-center font-semibold text-lg py-4">
        Get Started with Test Place for Youtube 2.0
      </h2>

      <div className="grid grid-cols-3 font-mono">
        {<OrderByTime />}
      </div>

    </main>
  );
}
