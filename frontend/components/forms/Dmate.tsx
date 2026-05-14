interface DmateProps {
    dmateData: any;
    setDmateData: (data: any) => void;
}

export default function Dmate({ dmateData, setDmateData }: DmateProps) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900">DMATE - Declaração Municipal de Atuação Emergencial</h1>
        </div>
    )
}