import * as tf from '@tensorflow/tfjs';

/**
 * Predicts next month's sales based on historical opportunity data.
 * This is a simple linear regression for demonstration.
 */
export const predictFutureSales = async (data: { amount: number, date: Date | string }[]) => {
    // Safety check: ensure data is an array and filter out invalid items
    if (!Array.isArray(data)) return { value: 0, growth: 0 };

    const validData = data.filter(item => {
        if (!item || typeof item.amount !== 'number') return false;
        const d = item.date ? new Date(item.date) : null;
        return d instanceof Date && !isNaN(d.getTime());
    });

    if (validData.length < 3) return { value: 0, growth: 0 };

    // Parse dates and prepare data: x = month index, y = total amount in that month
    const monthlyTotals: { [key: string]: number } = {};
    validData.forEach(item => {
        const date = new Date(item.date);
        const month = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyTotals[month] = (monthlyTotals[month] || 0) + (item.amount || 0);
    });

    const sortedMonths = Object.keys(monthlyTotals).sort();
    if (sortedMonths.length < 2) {
        const lastValue = monthlyTotals[sortedMonths[0]] || 0;
        return { value: lastValue * 1.05, growth: 5 };
    }

    const xs = sortedMonths.map((_, i) => i);
    const ys = sortedMonths.map(m => monthlyTotals[m]);

    // Normalize
    const xMax = Math.max(...xs) || 1;
    const yMax = Math.max(...ys) || 1;

    const normX = xs.map(x => x / xMax);
    const normY = ys.map(y => y / yMax);

    try {
        // Model
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
        model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

        const tensorX = tf.tensor2d(normX, [normX.length, 1]);
        const tensorY = tf.tensor2d(normY, [normY.length, 1]);

        await model.fit(tensorX, tensorY, { epochs: 50, verbose: 0 });

        // Predict next step
        const nextX = xs.length / xMax;
        const prediction = model.predict(tf.tensor2d([nextX], [1, 1])) as tf.Tensor;

        const predictedRaw = (await prediction.data())[0];
        const predictedValue = Math.max(0, predictedRaw * yMax);

        // Calculate growth relative to last month
        const lastValue = ys[ys.length - 1];
        const growth = lastValue > 0 ? ((predictedValue - lastValue) / lastValue) * 100 : 0;

        // Cleanup tensors
        tensorX.dispose();
        tensorY.dispose();
        prediction.dispose();
        model.dispose();

        return {
            value: Math.round(predictedValue),
            growth: Math.round(growth * 10) / 10
        };
    } catch (e) {
        console.error('ML Prediction error:', e);
        return { value: 0, growth: 0 };
    }
};
