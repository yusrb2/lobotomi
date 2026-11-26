package com.lobotomi.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

public class BreathRingView extends View {
    private final Paint outerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint innerFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint innerStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private float progressScale = 0.62f;

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
        outerPaint.setStrokeWidth(1.25f * density);
        outerPaint.setColor(0xFF2C2A27);

        innerFillPaint.setStyle(Paint.Style.FILL);
        innerFillPaint.setColor(0xFF1C1B1A);

        innerStrokePaint.setStyle(Paint.Style.STROKE);
        innerStrokePaint.setStrokeWidth(1.5f * density);
        innerStrokePaint.setColor(0xFF7A9E84);
    }

    public void setProgressScale(float scale) {
        float clamped = Math.max(0.55f, Math.min(1.0f, scale));
        if (Math.abs(clamped - progressScale) > 0.001f) {
            progressScale = clamped;
            invalidate();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float maxRadius = Math.min(cx, cy) - 8f;
        if (maxRadius <= 0f) return;

        canvas.drawCircle(cx, cy, maxRadius, outerPaint);
        float innerRadius = maxRadius * 0.92f * progressScale;
        canvas.drawCircle(cx, cy, innerRadius, innerFillPaint);
        canvas.drawCircle(cx, cy, innerRadius, innerStrokePaint);
    }
}
