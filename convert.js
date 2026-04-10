export default function handler(req, res) {
    if (req.method === "POST") {
        const data = req.body;

        const result = {
            message: "Backend working",
            input: data
        };

        res.status(200).json(result);
    } else {
        res.status(405).json({ error: "Only POST allowed" });
    }
}