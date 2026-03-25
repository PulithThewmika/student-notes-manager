/* eslint-disable react/prop-types, no-unused-vars */
import { useState, useEffect } from "react";
import NovaNotesWelcome from "./NovaNotesWelcome";

export function withWelcome(Component) {
  return function WrappedComponent(props) {
    const [started, setStarted] = useState(false);
    useEffect(() => {
        const hasStarted = sessionStorage.getItem("welcomePlayed");
        if(hasStarted) {
            setStarted(true);
        }
    }, [])
    if(started) {
        return <Component {...props} />
    } else {
        return <NovaNotesWelcome onEnter={() => { setStarted(true); sessionStorage.setItem("welcomePlayed", "true") }} />
    }
  }
}

