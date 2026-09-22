import Status from "../Status/Status";
import esphome from "@/assets/esphome.svg"
import ConsoleLog from "../ConsoleLog/ConsoleLog";

interface StatusCardProps {
    name: string;
    topic:string;
}

const StatusCard = ({name, topic}: StatusCardProps) => {
    return(
        <div className="card-head">
            <span className="card-icon">
                <img src={esphome} alt="logo estado" className="img_status" />
            </span>
            <h2>{name}</h2>
            <div className="status_box">
                    <Status topic={topic} />
            </div>
        </div>  
    )
};
export default StatusCard;