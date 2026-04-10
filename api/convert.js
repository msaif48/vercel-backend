export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Only POST requests allowed"
        });
    }

    const { x = 0, y = 0 } = req.body || {};

    return res.status(200).json({
        success: true,
        input: { x, y },
        output: {
            x3D: x,
            y3D: y,
            z3D: Math.sqrt(x * x + y * y)
        }
    });
}
