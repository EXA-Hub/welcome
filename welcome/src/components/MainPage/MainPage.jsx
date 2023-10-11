import React from "react";
import WelcomeCard from "./guildSettings/welcomeCard";
import { Switch, useDarkreader } from "react-darkreader";

export default function MainPage() {

  const theme = localStorage.getItem("Theme") === "true" ? true : false;
  const [isDark, { toggle }] = useDarkreader(theme);

  return (<div>
    <Switch
      checked={isDark}
      onChange={(e) => {
        toggle();
        localStorage.setItem("Theme", isDark ? false : true);
      }}
    />
    <WelcomeCard />
  </div>);
}
