package com.lobotomi.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.view.View;

public class BreathRingView extends View {
    private final Paint outerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint innerFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint innerStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path morphPath = new Path();
    private float progressScale = 0.62f;
    private float phaseAngle = 0f;

    public BreathRingView(Context context) {
        super(context);
        init(context);
    }

    public BreathRingView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public BreathRingView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(Context context) {
        float density = context.getResources().getDisplayMetrics().density;

        outerPaint.setStyle(Paint.Style.STROKE);
        outerPaint.setStrokeWidth(1.5f * density);
        outerPaint.setColor(0xFF36302B);

        innerFillPaint.setStyle(Paint.Style.FILL);
        innerFillPaint.setColor(0xFF231F1C);

        innerStrokePaint.setStyle(Paint.Style.STROKE);
        innerStrokePaint.setStrokeWidth(2.0f * density);
        innerStrokePaint.setColor(0xFF84A98C);
    }

    public void setProgressScale(float scale, float angleRad) {
        float clamped = Math.max(0.55f, Math.min(1.0f, scale));
        progressScale = clamped;
        phaseAngle = angleRad;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float maxRadius = Math.min(cx, cy) - 10f;
        if (maxRadius <= 0f) return;

        canvas.drawCircle(cx, cy, maxRadius, outerPaint);

        float baseRadius = maxRadius * 0.90f * progressScale;
        morphPath.reset();
        final int steps = 72;
        for (int i = 0; i <= steps; i++) {
            double theta = (Math.PI * 2.0 * i) / steps;
            double wobble =
                1.0 +
                0.032 * Math.sin(theta * 3.0 + phaseAngle) +
                0.022 * Math.cos(theta * 2.0 - phaseAngle * 0.7);
            float r = (float) (baseRadius * wobble);
            float x = cx + (float) Math.cos(theta) * r;
            float y = cy + (float) Math.sin(theta) * r;
            if (i == 0) {
                morphPath.moveTo(x, y);
            } else {
                morphPath.lineTo(x, y);
            }
        }
        morphPath.close();

        canvas.drawPath(morphPath, innerFillPaint);
        canvas.drawPath(morphPath, innerStrokePaint);
    }
}
