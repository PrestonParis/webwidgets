import Square from "./Square";

export default function File({ file }) {
    return (<>
        <div className="rank">
            <Square id={file + "1"} />
            <Square id={file + "2"} />
            <Square id={file + "3"} />
            <Square id={file + "4"} />
            <Square id={file + "5"} />
            <Square id={file + "6"} />
            <Square id={file + "7"} />
            <Square id={file + "8"} />
        </div>
    </>)
}