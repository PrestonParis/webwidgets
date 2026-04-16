"use client";

import { useState } from "react";
import CategorySelector from "@/components/UnitConvert/CategorySelector";
import UnitConverter from "@/components/UnitConvert/UnitConverter";
import { ArrowLeftRight } from "lucide-react";

export default function UnitConvertPage() {
    const [category, setCategory] = useState("Length");
    return (
    <div className="min-h-screen p-10 bg-background">
        <div className="text-center mb-8">
        <ArrowLeftRight className="mx-auto mb-2" />
        <h1 className="text-3xl font-bold">Unit Converter</h1>
        </div>

        <CategorySelector selected={category} onSelect={setCategory} />

        <div className="mt-8">
        <UnitConverter category={category} />
        </div>
    </div>);
}