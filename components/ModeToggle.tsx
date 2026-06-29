"use client";

import * as React from "react";
import { RiMoonLine, RiSunLine, RiComputerLine } from "@remixicon/react"
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
    {
        name: "Light",
        value: "light",
        icon: RiSunLine,
    },
    {
        name: "Dark",
        value: "dark",
        icon: RiMoonLine,
    },
    {
        name: "System",
        value: "system",
        icon: RiComputerLine,
    },
];

export function ModeToggle() {
    const [mounted, setMounted] = React.useState(false);
    const { setTheme, resolvedTheme } = useTheme();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="cursor-pointer" variant="outline" size="icon">
                    {resolvedTheme === "dark" ? <RiSunLine /> : <RiMoonLine />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {themes.map((theme) => (
                    <DropdownMenuItem
                        key={theme.value}
                        onClick={() => setTheme(theme.value)}
                    >
                        <theme.icon className="size-4" />
                        {theme.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
